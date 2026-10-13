# 이미 공개된 상업 태그를 승인된 설명 요청으로 남긴다.
# 요청 이미지는 ultary_tag_image 에 있는 파일을 그대로 복사한다.
# 실행: python 004_backfill_approved_tag_requests.py

import importlib.util
from pathlib import Path

SEED = Path(__file__).resolve().parent / "003_active_users_101_108.py"
spec = importlib.util.spec_from_file_location("seed_env", SEED)
env_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(env_mod)


def main():
    env = env_mod.load_env(env_mod.ENV_PATH)
    conn = env_mod.pymysql.connect(
        host=env["MYSQL_HOST"],
        port=int(env.get("MYSQL_PORT", "3306")),
        user=env["MYSQL_USER"],
        password=env["MYSQL_PASSWORD"],
        database=env["MYSQL_DATABASE"],
        charset="utf8mb4",
        autocommit=False,
    )
    cur = conn.cursor()
    cur.execute(
        """
        SELECT admin_no FROM ultary_admin
        WHERE status = 'ACTIVE'
        ORDER BY admin_no
        LIMIT 1
        """
    )
    admin = cur.fetchone()
    admin_no = admin[0] if admin else None

    cur.execute(
        """
        INSERT INTO ultary_tag_profile_request (
            tag_id, requester_user_no, title, content, link, status,
            reviewed_by_admin_id, reviewed_at, created_at
        )
        SELECT
            t.tag_id,
            t.created_by_user_no,
            t.title,
            t.content,
            t.link,
            'APPROVED',
            %s,
            t.created_at,
            t.created_at
        FROM ultary_tag t
        WHERE t.is_deleted = 0
          AND t.purpose = 'COMMERCIAL'
          AND t.profile_status = 'APPROVED'
          AND t.created_by_user_no IS NOT NULL
          AND NOT EXISTS (
                SELECT 1 FROM ultary_tag_profile_request r
                WHERE r.tag_id = t.tag_id AND r.status = 'APPROVED'
          )
        """,
        (admin_no,),
    )
    inserted = cur.rowcount

    cur.execute(
        """
        INSERT INTO ultary_tag_profile_request_image (
            tag_profile_request_id, file_id, sort_order
        )
        SELECT r.tag_profile_request_id, i.file_id, i.sort_order
        FROM ultary_tag_image i
        JOIN (
            SELECT tag_id, MAX(tag_profile_request_id) AS tag_profile_request_id
            FROM ultary_tag_profile_request
            WHERE status = 'APPROVED'
            GROUP BY tag_id
        ) r ON r.tag_id = i.tag_id
        WHERE NOT EXISTS (
            SELECT 1 FROM ultary_tag_profile_request_image x
            WHERE x.tag_profile_request_id = r.tag_profile_request_id
              AND x.sort_order = i.sort_order
        )
        """
    )
    images = cur.rowcount

    cur.execute(
        """
        SELECT t.tag_id
        FROM ultary_tag t
        WHERE t.is_deleted = 0
          AND t.purpose = 'COMMERCIAL'
          AND t.profile_status = 'APPROVED'
          AND t.created_by_user_no IS NULL
        """
    )
    skipped = [row[0] for row in cur.fetchall()]
    conn.commit()
    print(f"requests {inserted}")
    print(f"images {images}")
    print(f"skipped_no_owner {len(skipped)}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
