from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_community_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Community Corp {random_string().upper()}",
        "domain": f"comm_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Create Announcement
    ann_res = client.post("/api/community/announcements", json={
        "title": "Welcome to WorkSphere ERP v1.0!",
        "content": "We have launched the new performance management and community feeds spaces.",
        "isPinned": True
      }, headers=headers)
    assert ann_res.status_code == 201, ann_res.text
    assert ann_res.json()["data"]["isPinned"] is True

    # 4. Create Feed Post
    post_res = client.post("/api/community/posts", json={
        "content": "Pair programming with Antigravity AI assistant today!"
      }, headers=headers)
    assert post_res.status_code == 201, post_res.text
    post_id = post_res.json()["data"]["_id"]

    # 5. Like Feed Post
    like_res = client.post(f"/api/community/posts/{post_id}/like", json={}, headers=headers)
    assert like_res.status_code == 200, like_res.text
    assert like_res.json()["data"]["likesCount"] == 1

    # 6. Create Poll
    poll_res = client.post("/api/community/polls", json={
        "question": "What is your favorite modular system in WorkSphere?",
        "optionsJson": ["Performance (PMS)", "AI Interviews", "LMS Portal", "Feeds & Community"]
      }, headers=headers)
    assert poll_res.status_code == 201, poll_res.text
    poll_id = poll_res.json()["data"]["_id"]

    # 7. Cast Vote
    vote_res = client.post(f"/api/community/polls/{poll_id}/vote", json={
        "selectedOption": "Feeds & Community"
      }, headers=headers)
    assert vote_res.status_code == 200, vote_res.text
    assert len(vote_res.json()["data"]["votes"]) == 1

    # 8. Verify Duplicate Vote Blocked
    dup_res = client.post(f"/api/community/polls/{poll_id}/vote", json={
        "selectedOption": "LMS Portal"
      }, headers=headers)
    assert dup_res.status_code == 400, dup_res.text
    assert "already voted" in dup_res.json()["detail"]
