# 로컬 시드 보강. 사진 파일은 만들지 않는다.
# 101~104는 활동 목표치, 105~108은 그 절반.
# mcp/mariadb/.env 로 접속. 이미 있는 행은 건너뛴다.
# 실행: python 003_active_users_101_108.py

import os
import random
from datetime import datetime, timedelta
from pathlib import Path

import pymysql

random.seed(101)

ROOT = Path(__file__).resolve().parents[4]
ENV_PATH = ROOT / "mcp" / "mariadb" / ".env"

FULL = {
    "likes": 40,
    "comments": 30,
    "replies": 18,
    "comment_likes": 15,
    "reply_likes": 10,
    "pins": 3,
    "saves": 8,
    "story_likes": 8,
    "story_views": 12,
    "search": 8,
    "pet_tags": 8,
    "media_mentions": 8,
    "feed_tags": 12,
    "story_texts": 2,
    "story_mentions": 2,
    "viewer_out": 8,
    "viewer_in": 8,
    "dm_messages": 20,
}
HALF_USERS = {105, 106, 107, 108}
CORE = [101, 102, 103, 104]
ALL = [101, 102, 103, 104, 105, 106, 107, 108]
VIEWERS = list(range(201, 221))

COMMENTS = [
    "너무 귀여워요",
    "오늘 산책 나갔어요?",
    "밥은 잘 먹었나요",
    "사진 분위기 좋다",
    "우리 애도 저러는데",
    "공감해요",
    "어디서 찍은 거예요?",
    "건강해 보여요",
    "또 올려 주세요",
    "잘 자고 있네",
    "털 관리 어떻게 해요?",
    "표정이 웃겨요",
]
REPLIES = [
    "고마워요",
    "맞아요",
    "다음에 같이 가요",
    "집 근처예요",
    "자주 올려요",
    "그래요 저도요",
    "다음에 보여 줄게요",
]
DMS = [
    "오늘 뭐 해?",
    "사진 잘 봤어",
    "산책 가자",
    "밥 먹었어?",
    "그거 웃기더라",
    "나중에 보자",
    "응 알겠어",
    "좋아 좋아",
    "지금 집이야",
    "내일 시간 돼?",
]


def load_env(path):
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def goal(user_no, key):
    value = FULL[key]
    if user_no in HALF_USERS:
        return max(1, value // 2)
    return value


def ago(days_max=27):
    return datetime.now() - timedelta(
        days=random.randint(0, days_max),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


def pair_key(a, b):
    low, high = sorted((int(a), int(b)))
    return f"{low}:{high}"


def blocked(blocks, a, b):
    return (a, b) in blocks or (b, a) in blocks


def main():
    env = load_env(ENV_PATH)
    conn = pymysql.connect(
        host=env["MYSQL_HOST"],
        port=int(env.get("MYSQL_PORT") or 3306),
        user=env["MYSQL_USER"],
        password=env["MYSQL_PASSWORD"],
        database=env["MYSQL_DATABASE"],
        charset="utf8mb4",
        autocommit=False,
        ssl={"ssl": {}} if env.get("MYSQL_SSL", "false").lower() == "true" else None,
    )
    cur = conn.cursor()
    added = {}

    def bump(name, n=1):
        added[name] = added.get(name, 0) + n

    def insert_or_revive(insert_sql, insert_params, revive_sql=None, revive_params=None):
        try:
            cur.execute(insert_sql, insert_params)
            return True
        except pymysql.err.IntegrityError:
            if revive_sql:
                cur.execute(revive_sql, revive_params)
                return cur.rowcount > 0
            return False

    def fetchall(sql, args=None):
        cur.execute(sql, args or ())
        return cur.fetchall()

    feeds = {}
    for feed_id, user_no in fetchall(
        "SELECT feed_id, user_no FROM ultary_feed WHERE is_deleted=0 AND user_no BETWEEN 101 AND 108"
    ):
        feeds.setdefault(user_no, []).append(feed_id)
    all_feeds = [(fid, owner) for owner, ids in feeds.items() for fid in ids]

    stories = {}
    for story_id, user_no in fetchall(
        "SELECT story_id, user_no FROM ultary_story WHERE is_deleted=0 AND user_no BETWEEN 101 AND 108"
    ):
        stories.setdefault(user_no, []).append(story_id)
    all_stories = [(sid, owner) for owner, ids in stories.items() for sid in ids]

    pets = {}
    for pet_id, user_no in fetchall(
        "SELECT pet_id, user_no FROM ultary_pet WHERE is_deleted=0 AND user_no BETWEEN 101 AND 108"
    ):
        pets.setdefault(user_no, []).append(pet_id)
    all_pets = [(pid, owner) for owner, ids in pets.items() for pid in ids]

    media = {}
    for media_id, feed_id, user_no in fetchall(
        """
        SELECT m.feed_media_id, f.feed_id, f.user_no
        FROM ultary_feed_media m
        JOIN ultary_feed f ON f.feed_id = m.feed_id
        WHERE f.is_deleted = 0 AND f.user_no BETWEEN 101 AND 108
        """
    ):
        media.setdefault(user_no, []).append((media_id, feed_id))

    tags = [row[0] for row in fetchall("SELECT tag_id FROM ultary_tag WHERE is_deleted=0")]

    blocks = {(a, b) for a, b in fetchall(
        "SELECT blocker_user_no, blocked_user_no FROM ultary_user_block WHERE is_deleted=0"
    )}

    like_pairs = {(f, u) for f, u in fetchall(
        "SELECT feed_id, user_no FROM ultary_feed_like"
    )}
    deleted_likes = {(f, u) for f, u in fetchall(
        "SELECT feed_id, user_no FROM ultary_feed_like WHERE is_deleted=1"
    )}
    pin_pairs = {(f, u) for f, u in fetchall(
        "SELECT feed_id, user_no FROM ultary_feed_pin WHERE is_deleted=0"
    )}
    save_pairs = {(f, u) for f, u in fetchall(
        "SELECT feed_id, user_no FROM ultary_feed_save WHERE is_deleted=0"
    )}
    story_like_pairs = {(s, u) for s, u in fetchall(
        "SELECT story_id, user_no FROM ultary_story_like WHERE is_deleted=0"
    )}
    story_view_pairs = {(s, u) for s, u in fetchall(
        "SELECT story_id, viewer_user_no FROM ultary_story_view"
    )}
    search_pairs = {(u, t) for u, t in fetchall(
        "SELECT user_no, target_user_no FROM ultary_user_search_history"
    )}
    pet_tag_pairs = {(u, p) for u, p in fetchall(
        "SELECT user_no, pet_id FROM ultary_user_pet_tag_history"
    )}
    feed_tag_pairs = {(f, t) for f, t in fetchall(
        "SELECT feed_id, tag_id FROM ultary_feed_tag WHERE is_deleted=0"
    )}
    media_mention_pairs = {(m, p) for m, p in fetchall(
        "SELECT feed_media_id, pet_id FROM ultary_feed_media_mention"
    )}
    story_mention_pairs = {(s, p) for s, p in fetchall(
        "SELECT story_id, pet_id FROM ultary_story_mention"
    )}

    def count_of(sql, user_no):
        cur.execute(sql, (user_no,))
        return cur.fetchone()[0]

    neighbors = {}
    for nid, req, recv, status, back in fetchall(
        "SELECT neighbor_id, requester_user_no, receiver_user_no, status, followed_back FROM ultary_neighbor"
    ):
        neighbors[pair_key(req, recv)] = {
            "id": nid,
            "req": req,
            "recv": recv,
            "status": status,
            "back": int(back or 0),
        }

    def follows(actor, target):
        row = neighbors.get(pair_key(actor, target))
        if not row or row["status"] != "ACCEPTED":
            return False
        if row["req"] == actor and row["recv"] == target:
            return True
        return row["req"] == target and row["recv"] == actor and row["back"] == 1

    def outgoing(user_no, pool):
        return sum(1 for other in pool if other != user_no and follows(user_no, other))

    def incoming(user_no, pool):
        return sum(1 for other in pool if other != user_no and follows(other, user_no))

    touched_neighbors = set()

    def insert_follow(req, recv, mutual):
        key = pair_key(req, recv)
        row = neighbors.get(key)
        when = ago()
        if row is None:
            cur.execute(
                """
                INSERT INTO ultary_neighbor (
                    requester_user_no, receiver_user_no, pair_key, status,
                    followed_back, followed_back_at, requested_at, accepted_at
                ) VALUES (%s, %s, %s, 'ACCEPTED', %s, %s, %s, %s)
                """,
                (req, recv, key, 1 if mutual else 0, when if mutual else None, when, when),
            )
            nid = cur.lastrowid
            neighbors[key] = {
                "id": nid,
                "req": req,
                "recv": recv,
                "status": "ACCEPTED",
                "back": 1 if mutual else 0,
            }
            touched_neighbors.add(nid)
            bump("neighbor")
            return
        if row["status"] != "ACCEPTED":
            return
        if mutual and row["back"] == 0:
            cur.execute(
                """
                UPDATE ultary_neighbor
                SET followed_back = 1, followed_back_at = %s
                WHERE neighbor_id = %s AND followed_back = 0 AND status = 'ACCEPTED'
                """,
                (when, row["id"]),
            )
            if cur.rowcount:
                row["back"] = 1
                touched_neighbors.add(row["id"])
                bump("neighbor_back")

    for a, b in ((101, 102), (101, 103), (101, 104), (102, 103), (102, 104), (103, 104)):
        if blocked(blocks, a, b):
            continue
        insert_follow(a, b, True)
    for a, b in ((105, 106), (106, 107), (107, 108), (105, 108)):
        if blocked(blocks, a, b):
            continue
        insert_follow(a, b, True)

    for user_no in ALL:
        need_out = goal(user_no, "viewer_out") - outgoing(user_no, VIEWERS)
        for viewer in VIEWERS:
            if need_out <= 0:
                break
            if blocked(blocks, user_no, viewer):
                continue
            if neighbors.get(pair_key(user_no, viewer)):
                continue
            insert_follow(user_no, viewer, False)
            need_out -= 1
        need_in = goal(user_no, "viewer_in") - incoming(user_no, VIEWERS)
        for viewer in reversed(VIEWERS):
            if need_in <= 0:
                break
            if blocked(blocks, user_no, viewer):
                continue
            if neighbors.get(pair_key(user_no, viewer)):
                continue
            insert_follow(viewer, user_no, False)
            need_in -= 1

    touched_feeds = set()
    for user_no in ALL:
        have = count_of(
            "SELECT COUNT(*) FROM ultary_feed_like WHERE user_no=%s AND is_deleted=0",
            user_no,
        )
        active_likes = like_pairs - deleted_likes
        choices = [(fid, owner) for fid, owner in all_feeds if owner != user_no and (fid, user_no) not in active_likes and not blocked(blocks, user_no, owner)]
        random.shuffle(choices)
        for fid, owner in choices:
            if have >= goal(user_no, "likes"):
                break
            if (fid, user_no) in deleted_likes:
                cur.execute(
                    """
                    UPDATE ultary_feed_like
                    SET is_deleted = 0, deleted_at = NULL, created_at = %s
                    WHERE feed_id = %s AND user_no = %s
                    """,
                    (ago(), fid, user_no),
                )
            else:
                cur.execute(
                    "INSERT INTO ultary_feed_like (feed_id, user_no, created_at) VALUES (%s, %s, %s)",
                    (fid, user_no, ago()),
                )
            like_pairs.add((fid, user_no))
            deleted_likes.discard((fid, user_no))
            touched_feeds.add(fid)
            have += 1
            bump("feed_like")

    new_comments = []
    for user_no in ALL:
        have = count_of(
            "SELECT COUNT(*) FROM ultary_feed_comment WHERE user_no=%s AND is_deleted=0",
            user_no,
        )
        choices = [(fid, owner) for fid, owner in all_feeds if owner != user_no and not blocked(blocks, user_no, owner)]
        while have < goal(user_no, "comments") and choices:
            fid, owner = random.choice(choices)
            text = random.choice(COMMENTS)
            cur.execute(
                "INSERT INTO ultary_feed_comment (feed_id, user_no, content, created_at) VALUES (%s, %s, %s, %s)",
                (fid, user_no, text, ago()),
            )
            new_comments.append((cur.lastrowid, fid, user_no, owner, text))
            touched_feeds.add(fid)
            have += 1
            bump("comment")

    comment_rows = fetchall(
        """
        SELECT c.feed_comment_id, c.feed_id, c.user_no, f.user_no
        FROM ultary_feed_comment c
        JOIN ultary_feed f ON f.feed_id = c.feed_id AND f.is_deleted = 0
        WHERE c.is_deleted = 0 AND (c.user_no BETWEEN 101 AND 108 OR f.user_no BETWEEN 101 AND 108)
        """
    )
    new_replies = []
    for user_no in ALL:
        have = count_of(
            "SELECT COUNT(*) FROM ultary_feed_reply WHERE user_no=%s AND is_deleted=0",
            user_no,
        )
        choices = [row for row in comment_rows if row[2] != user_no and not blocked(blocks, user_no, row[2]) and not blocked(blocks, user_no, row[3])]
        while have < goal(user_no, "replies") and choices:
            cid, fid, author, owner = random.choice(choices)
            text = random.choice(REPLIES)
            cur.execute(
                "INSERT INTO ultary_feed_reply (feed_comment_id, user_no, content, created_at) VALUES (%s, %s, %s, %s)",
                (cid, user_no, text, ago()),
            )
            new_replies.append((cur.lastrowid, cid, fid, user_no, text))
            touched_feeds.add(fid)
            have += 1
            bump("reply")

    comment_like_pairs = {(c, u) for c, u in fetchall(
        "SELECT feed_comment_id, user_no FROM ultary_feed_comment_like WHERE is_deleted=0"
    )}
    reply_like_pairs = {(r, u) for r, u in fetchall(
        "SELECT feed_reply_id, user_no FROM ultary_feed_reply_like WHERE is_deleted=0"
    )}
    reply_rows = fetchall(
        """
        SELECT r.feed_reply_id, r.user_no, c.feed_id
        FROM ultary_feed_reply r
        JOIN ultary_feed_comment c ON c.feed_comment_id = r.feed_comment_id AND c.is_deleted = 0
        WHERE r.is_deleted = 0 AND (r.user_no BETWEEN 101 AND 108 OR c.user_no BETWEEN 101 AND 108)
        """
    )
    touched_comments = set()
    touched_replies = set()
    for user_no in ALL:
        have = sum(1 for c, u in comment_like_pairs if u == user_no)
        choices = [row for row in comment_rows if row[2] != user_no and (row[0], user_no) not in comment_like_pairs and not blocked(blocks, user_no, row[2])]
        random.shuffle(choices)
        for cid, fid, author, owner in choices:
            if have >= goal(user_no, "comment_likes"):
                break
            when = ago()
            if not insert_or_revive(
                "INSERT INTO ultary_feed_comment_like (feed_comment_id, user_no, created_at) VALUES (%s, %s, %s)",
                (cid, user_no, when),
                """
                UPDATE ultary_feed_comment_like
                SET is_deleted = 0, deleted_at = NULL, created_at = %s
                WHERE feed_comment_id = %s AND user_no = %s
                """,
                (when, cid, user_no),
            ):
                continue
            comment_like_pairs.add((cid, user_no))
            touched_comments.add(cid)
            have += 1
            bump("comment_like")
        have = sum(1 for r, u in reply_like_pairs if u == user_no)
        choices = [row for row in reply_rows if row[1] != user_no and (row[0], user_no) not in reply_like_pairs and not blocked(blocks, user_no, row[1])]
        random.shuffle(choices)
        for rid, author, fid in choices:
            if have >= goal(user_no, "reply_likes"):
                break
            when = ago()
            if not insert_or_revive(
                "INSERT INTO ultary_feed_reply_like (feed_reply_id, user_no, created_at) VALUES (%s, %s, %s)",
                (rid, user_no, when),
                """
                UPDATE ultary_feed_reply_like
                SET is_deleted = 0, deleted_at = NULL, created_at = %s
                WHERE feed_reply_id = %s AND user_no = %s
                """,
                (when, rid, user_no),
            ):
                continue
            reply_like_pairs.add((rid, user_no))
            touched_replies.add(rid)
            have += 1
            bump("reply_like")

    for user_no in ALL:
        have = sum(1 for f, u in pin_pairs if u == user_no)
        for fid in feeds.get(user_no, []):
            if have >= goal(user_no, "pins"):
                break
            if (fid, user_no) in pin_pairs:
                continue
            when = ago()
            if not insert_or_revive(
                "INSERT INTO ultary_feed_pin (feed_id, user_no, created_at) VALUES (%s, %s, %s)",
                (fid, user_no, when),
                """
                UPDATE ultary_feed_pin
                SET is_deleted = 0, deleted_at = NULL, created_at = %s
                WHERE feed_id = %s AND user_no = %s
                """,
                (when, fid, user_no),
            ):
                continue
            pin_pairs.add((fid, user_no))
            touched_feeds.add(fid)
            have += 1
            bump("pin")
        have = sum(1 for f, u in save_pairs if u == user_no)
        choices = [(fid, owner) for fid, owner in all_feeds if owner != user_no and (fid, user_no) not in save_pairs and not blocked(blocks, user_no, owner)]
        random.shuffle(choices)
        for fid, owner in choices:
            if have >= goal(user_no, "saves"):
                break
            when = ago()
            if not insert_or_revive(
                "INSERT INTO ultary_feed_save (feed_id, user_no, created_at) VALUES (%s, %s, %s)",
                (fid, user_no, when),
                """
                UPDATE ultary_feed_save
                SET is_deleted = 0, deleted_at = NULL, created_at = %s
                WHERE feed_id = %s AND user_no = %s
                """,
                (when, fid, user_no),
            ):
                continue
            save_pairs.add((fid, user_no))
            have += 1
            bump("save")

    for user_no in ALL:
        have = sum(1 for s, u in story_like_pairs if u == user_no)
        choices = [(sid, owner) for sid, owner in all_stories if owner != user_no and (sid, user_no) not in story_like_pairs and not blocked(blocks, user_no, owner)]
        random.shuffle(choices)
        for sid, owner in choices:
            if have >= goal(user_no, "story_likes"):
                break
            when = ago()
            if not insert_or_revive(
                "INSERT INTO ultary_story_like (story_id, user_no, created_at) VALUES (%s, %s, %s)",
                (sid, user_no, when),
                """
                UPDATE ultary_story_like
                SET is_deleted = 0, deleted_at = NULL, created_at = %s
                WHERE story_id = %s AND user_no = %s
                """,
                (when, sid, user_no),
            ):
                continue
            story_like_pairs.add((sid, user_no))
            have += 1
            bump("story_like")
        have = sum(1 for s, u in story_view_pairs if u == user_no)
        choices = [(sid, owner) for sid, owner in all_stories if (sid, user_no) not in story_view_pairs and not blocked(blocks, user_no, owner)]
        random.shuffle(choices)
        for sid, owner in choices:
            if have >= goal(user_no, "story_views"):
                break
            when = ago()
            if not insert_or_revive(
                "INSERT INTO ultary_story_view (story_id, viewer_user_no, viewed_at) VALUES (%s, %s, %s)",
                (sid, user_no, when),
            ):
                continue
            story_view_pairs.add((sid, user_no))
            have += 1
            bump("story_view")

    for user_no in ALL:
        own = stories.get(user_no, [])
        if not own:
            continue
        have = count_of(
            """
            SELECT COUNT(*) FROM ultary_story_text t
            JOIN ultary_story s ON s.story_id = t.story_id
            WHERE s.user_no = %s
            """,
            user_no,
        )
        for sid in own:
            if have >= goal(user_no, "story_texts"):
                break
            cur.execute(
                """
                INSERT INTO ultary_story_text (
                    story_id, content, font_size, is_bold, is_underline, is_strikethrough,
                    color, pos_x, pos_y, sort_order
                ) VALUES (%s, %s, 16, 0, 0, 0, '#FFFFFF', %s, %s, 0)
                """,
                (sid, random.choice(COMMENTS), random.randint(20, 70), random.randint(20, 70)),
            )
            have += 1
            bump("story_text")
        have = count_of(
            """
            SELECT COUNT(*) FROM ultary_story_mention m
            JOIN ultary_story s ON s.story_id = m.story_id
            WHERE s.user_no = %s
            """,
            user_no,
        )
        for sid in own:
            if have >= goal(user_no, "story_mentions"):
                break
            options = [(pid, owner) for pid, owner in all_pets if owner != user_no and (sid, pid) not in story_mention_pairs and not blocked(blocks, user_no, owner)]
            if not options:
                continue
            pid, owner = random.choice(options)
            cur.execute(
                """
                INSERT INTO ultary_story_mention (
                    story_id, pet_id, pos_x, pos_y, sort_order, added_by_user_no
                ) VALUES (%s, %s, %s, %s, 0, %s)
                """,
                (sid, pid, random.randint(15, 80), random.randint(15, 80), user_no),
            )
            story_mention_pairs.add((sid, pid))
            have += 1
            bump("story_mention")

    for user_no in ALL:
        slots = media.get(user_no, [])
        if not slots:
            continue
        have = 0
        for media_id, feed_id in slots:
            have += sum(1 for m, p in media_mention_pairs if m == media_id)
        for media_id, feed_id in slots:
            if have >= goal(user_no, "media_mentions"):
                break
            options = [(pid, owner) for pid, owner in all_pets if owner != user_no and (media_id, pid) not in media_mention_pairs and not blocked(blocks, user_no, owner)]
            if not options:
                continue
            pid, owner = random.choice(options)
            cur.execute(
                """
                INSERT INTO ultary_feed_media_mention (
                    feed_media_id, pet_id, pos_x, pos_y, added_by_user_no
                ) VALUES (%s, %s, %s, %s, %s)
                """,
                (media_id, pid, random.randint(15, 80), random.randint(15, 80), user_no),
            )
            media_mention_pairs.add((media_id, pid))
            touched_feeds.add(feed_id)
            have += 1
            bump("media_mention")
        have = sum(1 for fid in feeds.get(user_no, []) for t in tags if (fid, t) in feed_tag_pairs)
        for fid in feeds.get(user_no, []):
            if have >= goal(user_no, "feed_tags"):
                break
            options = [t for t in tags if (fid, t) not in feed_tag_pairs]
            if not options:
                continue
            tag_id = random.choice(options)
            cur.execute(
                "INSERT INTO ultary_feed_tag (feed_id, tag_id) VALUES (%s, %s)",
                (fid, tag_id),
            )
            feed_tag_pairs.add((fid, tag_id))
            have += 1
            bump("feed_tag")

    mention_comments = new_comments[::3]
    for cid, fid, user_no, owner, text in mention_comments:
        options = [(pid, pet_owner) for pid, pet_owner in all_pets if pet_owner not in (user_no, owner) and not blocked(blocks, user_no, pet_owner)]
        if not options:
            continue
        pid, pet_owner = random.choice(options)
        cur.execute(
            """
            INSERT INTO ultary_feed_comment_mention (
                feed_comment_id, mentioned_pet_id
            ) VALUES (%s, %s)
            """,
            (cid, pid),
        )
        touched_comments.add(cid)
        bump("comment_mention")

    for user_no in ALL:
        have = sum(1 for u, t in search_pairs if u == user_no)
        for target in ALL + VIEWERS:
            if have >= goal(user_no, "search"):
                break
            if target == user_no or (user_no, target) in search_pairs or blocked(blocks, user_no, target):
                continue
            cur.execute(
                "INSERT INTO ultary_user_search_history (user_no, target_user_no, searched_at) VALUES (%s, %s, %s)",
                (user_no, target, ago(10)),
            )
            search_pairs.add((user_no, target))
            have += 1
            bump("search")
        have = sum(1 for u, p in pet_tag_pairs if u == user_no)
        for pid, owner in all_pets:
            if have >= goal(user_no, "pet_tags"):
                break
            if (user_no, pid) in pet_tag_pairs or blocked(blocks, user_no, owner):
                continue
            cur.execute(
                "INSERT INTO ultary_user_pet_tag_history (user_no, pet_id, used_at) VALUES (%s, %s, %s)",
                (user_no, pid, ago(10)),
            )
            pet_tag_pairs.add((user_no, pid))
            have += 1
            bump("pet_tag")

    rooms = {}
    for room_id, low, high, cnt in fetchall(
        """
        SELECT r.dm_room_id, r.user_low, r.user_high, COUNT(m.dm_message_id)
        FROM ultary_dm_room r
        LEFT JOIN ultary_dm_message m ON m.dm_room_id = r.dm_room_id
        GROUP BY r.dm_room_id, r.user_low, r.user_high
        """
    ):
        rooms[pair_key(low, high)] = {"id": room_id, "low": low, "high": high, "count": cnt}

    dm_pairs = []
    for i, a in enumerate(CORE):
        for b in CORE[i + 1 :]:
            dm_pairs.append((a, b, 20))
        dm_pairs.append((a, 105, 20))
    dm_pairs.extend([(105, 106, 10), (105, 107, 10), (106, 108, 10), (107, 108, 10)])
    for a, b, target in dm_pairs:
        if blocked(blocks, a, b):
            continue
        key = pair_key(a, b)
        room = rooms.get(key)
        if room is None:
            low, high = sorted((a, b))
            cur.execute(
                "INSERT INTO ultary_dm_room (pair_key, user_low, user_high) VALUES (%s, %s, %s)",
                (key, low, high),
            )
            room = {"id": cur.lastrowid, "low": low, "high": high, "count": 0}
            rooms[key] = room
            bump("dm_room")
        sender = a
        while room["count"] < target:
            cur.execute(
                """
                INSERT INTO ultary_dm_message (dm_room_id, sender_user_no, body, share_type, created_at)
                VALUES (%s, %s, %s, 'NONE', %s)
                """,
                (room["id"], sender, random.choice(DMS), ago(28)),
            )
            room["count"] += 1
            sender = b if sender == a else a
            bump("dm_message")

    cur.execute(
        """
        UPDATE ultary_feed f
        JOIN (
            SELECT feed_id, COUNT(*) cnt
            FROM ultary_feed_like
            WHERE is_deleted = 0
            GROUP BY feed_id
        ) x ON x.feed_id = f.feed_id
        SET f.like_count = x.cnt
        WHERE f.user_no BETWEEN 101 AND 108
        """
    )
    cur.execute(
        """
        UPDATE ultary_feed f
        JOIN (
            SELECT feed_id, COUNT(*) cnt
            FROM ultary_feed_comment
            WHERE is_deleted = 0
            GROUP BY feed_id
        ) x ON x.feed_id = f.feed_id
        SET f.comment_count = x.cnt
        WHERE f.user_no BETWEEN 101 AND 108
        """
    )
    cur.execute(
        """
        UPDATE ultary_feed f
        JOIN (
            SELECT feed_id, COUNT(*) cnt
            FROM ultary_feed_pin
            WHERE is_deleted = 0
            GROUP BY feed_id
        ) x ON x.feed_id = f.feed_id
        SET f.pin_count = x.cnt
        WHERE f.feed_id IN (SELECT feed_id FROM (SELECT feed_id FROM ultary_feed WHERE user_no BETWEEN 101 AND 108) t)
           OR f.feed_id IN (SELECT feed_id FROM (SELECT DISTINCT feed_id FROM ultary_feed_pin) p)
        """
    )
    cur.execute(
        """
        UPDATE ultary_feed_comment c
        JOIN (
            SELECT feed_comment_id, COUNT(*) cnt
            FROM ultary_feed_comment_like
            WHERE is_deleted = 0
            GROUP BY feed_comment_id
        ) x ON x.feed_comment_id = c.feed_comment_id
        SET c.like_count = x.cnt
        """
    )
    cur.execute(
        """
        UPDATE ultary_feed_reply r
        JOIN (
            SELECT feed_reply_id, COUNT(*) cnt
            FROM ultary_feed_reply_like
            WHERE is_deleted = 0
            GROUP BY feed_reply_id
        ) x ON x.feed_reply_id = r.feed_reply_id
        SET r.like_count = x.cnt
        """
    )

    not_blocked = """
        NOT EXISTS (
            SELECT 1 FROM ultary_user_block b
            WHERE b.is_deleted = 0
              AND (
                    (b.blocker_user_no = {owner} AND b.blocked_user_no = {actor})
                    OR (b.blocker_user_no = {actor} AND b.blocked_user_no = {owner})
              )
        )
    """

    def upsert_notice(sql):
        cur.execute(sql)
        bump("notification_write", cur.rowcount)

    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, feed_id, content, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT * FROM (
            SELECT
                f.user_no,
                (
                    SELECT l.user_no FROM ultary_feed_like l
                    WHERE l.feed_id = f.feed_id AND l.is_deleted = 0 AND l.user_no <> f.user_no
                      AND {not_blocked.format(owner='f.user_no', actor='l.user_no')}
                    ORDER BY l.created_at DESC, l.feed_like_id DESC
                    LIMIT 1
                ) AS actor_user_no,
                'FEED_LIKE',
                f.feed_id,
                LEFT(f.content, 40),
                (
                    SELECT COUNT(DISTINCT l.user_no) FROM ultary_feed_like l
                    WHERE l.feed_id = f.feed_id AND l.is_deleted = 0 AND l.user_no <> f.user_no
                      AND {not_blocked.format(owner='f.user_no', actor='l.user_no')}
                ) AS actor_count,
                0 AS has_comment, 0 AS has_reply,
                CONCAT('FEED_LIKE:', f.feed_id),
                0 AS is_read, NOW() AS created_at, NOW() AS updated_at
            FROM ultary_feed f
            WHERE f.is_deleted = 0 AND f.user_no BETWEEN 101 AND 108
        ) src
        WHERE src.actor_user_no IS NOT NULL AND src.actor_count > 0
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            content = VALUES(content),
            actor_count = VALUES(actor_count),
            feed_id = VALUES(feed_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, feed_id, feed_comment_id, content, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT * FROM (
            SELECT
                c.user_no,
                (
                    SELECT l.user_no FROM ultary_feed_comment_like l
                    WHERE l.feed_comment_id = c.feed_comment_id AND l.is_deleted = 0 AND l.user_no <> c.user_no
                      AND {not_blocked.format(owner='c.user_no', actor='l.user_no')}
                    ORDER BY l.created_at DESC, l.feed_comment_like_id DESC
                    LIMIT 1
                ) AS actor_user_no,
                'COMMENT_LIKE',
                c.feed_id,
                c.feed_comment_id,
                LEFT(c.content, 40),
                (
                    SELECT COUNT(DISTINCT l.user_no) FROM ultary_feed_comment_like l
                    WHERE l.feed_comment_id = c.feed_comment_id AND l.is_deleted = 0 AND l.user_no <> c.user_no
                      AND {not_blocked.format(owner='c.user_no', actor='l.user_no')}
                ) AS actor_count,
                0 AS has_comment, 0 AS has_reply,
                CONCAT('COMMENT_LIKE:', c.feed_comment_id),
                0 AS is_read, NOW() AS created_at, NOW() AS updated_at
            FROM ultary_feed_comment c
            JOIN ultary_feed f ON f.feed_id = c.feed_id AND f.is_deleted = 0
            WHERE c.is_deleted = 0 AND (c.user_no BETWEEN 101 AND 108 OR f.user_no BETWEEN 101 AND 108)
        ) src
        WHERE src.actor_user_no IS NOT NULL AND src.actor_count > 0
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            content = VALUES(content),
            actor_count = VALUES(actor_count),
            feed_id = VALUES(feed_id),
            feed_comment_id = VALUES(feed_comment_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, feed_id, feed_comment_id, feed_reply_id, content, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT * FROM (
            SELECT
                r.user_no,
                (
                    SELECT l.user_no FROM ultary_feed_reply_like l
                    WHERE l.feed_reply_id = r.feed_reply_id AND l.is_deleted = 0 AND l.user_no <> r.user_no
                      AND {not_blocked.format(owner='r.user_no', actor='l.user_no')}
                    ORDER BY l.created_at DESC, l.feed_reply_like_id DESC
                    LIMIT 1
                ) AS actor_user_no,
                'REPLY_LIKE',
                c.feed_id,
                c.feed_comment_id,
                r.feed_reply_id,
                LEFT(r.content, 40),
                (
                    SELECT COUNT(DISTINCT l.user_no) FROM ultary_feed_reply_like l
                    WHERE l.feed_reply_id = r.feed_reply_id AND l.is_deleted = 0 AND l.user_no <> r.user_no
                      AND {not_blocked.format(owner='r.user_no', actor='l.user_no')}
                ) AS actor_count,
                0 AS has_comment, 0 AS has_reply,
                CONCAT('REPLY_LIKE:', r.feed_reply_id),
                0 AS is_read, NOW() AS created_at, NOW() AS updated_at
            FROM ultary_feed_reply r
            JOIN ultary_feed_comment c ON c.feed_comment_id = r.feed_comment_id AND c.is_deleted = 0
            WHERE r.is_deleted = 0 AND (r.user_no BETWEEN 101 AND 108 OR c.user_no BETWEEN 101 AND 108)
        ) src
        WHERE src.actor_user_no IS NOT NULL AND src.actor_count > 0
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            content = VALUES(content),
            actor_count = VALUES(actor_count),
            feed_id = VALUES(feed_id),
            feed_comment_id = VALUES(feed_comment_id),
            feed_reply_id = VALUES(feed_reply_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    owner_of_feed = {fid: owner for fid, owner in all_feeds}
    comment_events = []
    for feed_id, actor, content, comment_id, created_at in fetchall(
        """
        SELECT c.feed_id, c.user_no, c.content, c.feed_comment_id, c.created_at
        FROM ultary_feed_comment c
        JOIN ultary_feed f ON f.feed_id = c.feed_id AND f.is_deleted = 0
        WHERE c.is_deleted = 0 AND f.user_no BETWEEN 101 AND 108 AND c.user_no <> f.user_no
        """
    ):
        comment_events.append((feed_id, actor, content, comment_id, None, created_at, "C"))
    for feed_id, actor, content, comment_id, reply_id, created_at in fetchall(
        """
        SELECT c.feed_id, r.user_no, r.content, c.feed_comment_id, r.feed_reply_id, r.created_at
        FROM ultary_feed_reply r
        JOIN ultary_feed_comment c ON c.feed_comment_id = r.feed_comment_id AND c.is_deleted = 0
        JOIN ultary_feed f ON f.feed_id = c.feed_id AND f.is_deleted = 0
        WHERE r.is_deleted = 0 AND f.user_no BETWEEN 101 AND 108 AND r.user_no <> f.user_no
        """
    ):
        comment_events.append((feed_id, actor, content, comment_id, reply_id, created_at, "R"))
    grouped_comments = {}
    for event in comment_events:
        feed_id, actor = event[0], event[1]
        owner = owner_of_feed.get(feed_id)
        if owner is None or blocked(blocks, owner, actor):
            continue
        grouped_comments.setdefault(feed_id, []).append(event)
    for feed_id, events in grouped_comments.items():
        events.sort(key=lambda row: (row[5], row[3] or 0, row[4] or 0))
        latest = events[-1]
        actors = {row[1] for row in events}
        cur.execute(
            """
            INSERT INTO ultary_notification (
                receiver_user_no, actor_user_no, type, feed_id, feed_comment_id, feed_reply_id, content,
                actor_count, has_comment, has_reply, group_key, is_read, created_at, updated_at
            ) VALUES (%s, %s, 'FEED_COMMENT', %s, %s, %s, %s, %s, %s, %s, %s, 0, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                actor_user_no = VALUES(actor_user_no),
                content = VALUES(content),
                actor_count = VALUES(actor_count),
                has_comment = VALUES(has_comment),
                has_reply = VALUES(has_reply),
                feed_comment_id = VALUES(feed_comment_id),
                feed_reply_id = VALUES(feed_reply_id),
                is_read = 0,
                read_at = NULL,
                updated_at = NOW()
            """,
            (
                owner_of_feed[feed_id],
                latest[1],
                feed_id,
                latest[3],
                latest[4],
                (latest[2] or "")[:40],
                len(actors),
                1 if any(row[6] == "C" for row in events) else 0,
                1 if any(row[6] == "R" for row in events) else 0,
                f"FEED_COMMENT:{feed_id}",
            ),
        )
        bump("notification_write", cur.rowcount)
    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, story_id, content, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT * FROM (
            SELECT
                s.user_no,
                (
                    SELECT l.user_no FROM ultary_story_like l
                    WHERE l.story_id = s.story_id AND l.is_deleted = 0 AND l.user_no <> s.user_no
                      AND {not_blocked.format(owner='s.user_no', actor='l.user_no')}
                    ORDER BY l.created_at DESC, l.story_like_id DESC
                    LIMIT 1
                ) AS actor_user_no,
                'STORY_LIKE',
                s.story_id,
                LEFT(s.caption, 40),
                (
                    SELECT COUNT(DISTINCT l.user_no) FROM ultary_story_like l
                    WHERE l.story_id = s.story_id AND l.is_deleted = 0 AND l.user_no <> s.user_no
                      AND {not_blocked.format(owner='s.user_no', actor='l.user_no')}
                ) AS actor_count,
                0 AS has_comment, 0 AS has_reply,
                CONCAT('STORY_LIKE:', s.story_id),
                0 AS is_read, NOW() AS created_at, NOW() AS updated_at
            FROM ultary_story s
            WHERE s.is_deleted = 0 AND s.user_no BETWEEN 101 AND 108
        ) src
        WHERE src.actor_user_no IS NOT NULL AND src.actor_count > 0
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            content = VALUES(content),
            actor_count = VALUES(actor_count),
            story_id = VALUES(story_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, feed_id, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT DISTINCT
            p.user_no,
            f.user_no,
            'FEED_TAG',
            f.feed_id,
            1, 0, 0,
            CONCAT('FEED_TAG:', f.feed_id),
            0, NOW(), NOW()
        FROM ultary_feed_media_mention mm
        JOIN ultary_feed_media m ON m.feed_media_id = mm.feed_media_id
        JOIN ultary_feed f ON f.feed_id = m.feed_id AND f.is_deleted = 0
        JOIN ultary_pet p ON p.pet_id = mm.pet_id AND p.is_deleted = 0
        WHERE p.user_no <> f.user_no
          AND f.user_no BETWEEN 101 AND 108
          AND {not_blocked.format(owner='p.user_no', actor='f.user_no')}
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            feed_id = VALUES(feed_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, story_id, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT DISTINCT
            p.user_no,
            s.user_no,
            'STORY_TAG',
            s.story_id,
            1, 0, 0,
            CONCAT('STORY_TAG:', s.story_id),
            0, NOW(), NOW()
        FROM ultary_story_mention sm
        JOIN ultary_story s ON s.story_id = sm.story_id AND s.is_deleted = 0
        JOIN ultary_pet p ON p.pet_id = sm.pet_id AND p.is_deleted = 0
        WHERE p.user_no <> s.user_no
          AND s.user_no BETWEEN 101 AND 108
          AND {not_blocked.format(owner='p.user_no', actor='s.user_no')}
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            story_id = VALUES(story_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        f"""
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, feed_id, feed_comment_id, content, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT DISTINCT
            p.user_no,
            c.user_no,
            'COMMENT_MENTION',
            c.feed_id,
            c.feed_comment_id,
            LEFT(c.content, 40),
            1, 0, 0,
            CONCAT('COMMENT_MENTION:', c.feed_comment_id),
            0, NOW(), NOW()
        FROM ultary_feed_comment_mention men
        JOIN ultary_feed_comment c ON c.feed_comment_id = men.feed_comment_id AND c.is_deleted = 0
        JOIN ultary_pet p ON p.pet_id = men.mentioned_pet_id AND p.is_deleted = 0
        WHERE men.feed_reply_id IS NULL
          AND p.user_no <> c.user_no
          AND c.user_no BETWEEN 101 AND 108
          AND {not_blocked.format(owner='p.user_no', actor='c.user_no')}
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            content = VALUES(content),
            feed_id = VALUES(feed_id),
            feed_comment_id = VALUES(feed_comment_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        """
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, neighbor_id, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT
            n.receiver_user_no,
            n.requester_user_no,
            'NEIGHBOR_REQUEST',
            n.neighbor_id,
            1, 0, 0,
            CONCAT('NEIGHBOR_REQUEST:', n.neighbor_id),
            0, NOW(), NOW()
        FROM ultary_neighbor n
        JOIN ultary_user actor ON actor.user_no = n.requester_user_no AND actor.withdrawal_status = 'ACTIVE'
        JOIN ultary_user recv ON recv.user_no = n.receiver_user_no AND recv.withdrawal_status = 'ACTIVE'
        WHERE n.status IN ('PENDING', 'ACCEPTED')
          AND (n.requester_user_no BETWEEN 101 AND 108 OR n.receiver_user_no BETWEEN 101 AND 108)
          AND NOT EXISTS (
                SELECT 1 FROM ultary_user_block b
                WHERE b.is_deleted = 0
                  AND (
                        (b.blocker_user_no = n.receiver_user_no AND b.blocked_user_no = n.requester_user_no)
                        OR (b.blocker_user_no = n.requester_user_no AND b.blocked_user_no = n.receiver_user_no)
                  )
          )
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            neighbor_id = VALUES(neighbor_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )
    upsert_notice(
        """
        INSERT INTO ultary_notification (
            receiver_user_no, actor_user_no, type, neighbor_id, actor_count,
            has_comment, has_reply, group_key, is_read, created_at, updated_at
        )
        SELECT
            n.requester_user_no,
            n.receiver_user_no,
            'NEIGHBOR_REQUEST',
            n.neighbor_id,
            1, 0, 0,
            CONCAT('NEIGHBOR_FOLLOW:', n.neighbor_id),
            0, NOW(), NOW()
        FROM ultary_neighbor n
        WHERE n.status = 'ACCEPTED' AND n.followed_back = 1
          AND (n.requester_user_no BETWEEN 101 AND 108 OR n.receiver_user_no BETWEEN 101 AND 108)
          AND NOT EXISTS (
                SELECT 1 FROM ultary_user_block b
                WHERE b.is_deleted = 0
                  AND (
                        (b.blocker_user_no = n.receiver_user_no AND b.blocked_user_no = n.requester_user_no)
                        OR (b.blocker_user_no = n.requester_user_no AND b.blocked_user_no = n.receiver_user_no)
                  )
          )
        ON DUPLICATE KEY UPDATE
            actor_user_no = VALUES(actor_user_no),
            neighbor_id = VALUES(neighbor_id),
            is_read = 0,
            read_at = NULL,
            updated_at = NOW()
        """
    )

    conn.commit()
    print("ADDED")
    for key in sorted(added):
        print(f"{key} {added[key]}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
