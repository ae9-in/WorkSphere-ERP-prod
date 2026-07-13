from fastapi.testclient import TestClient
from app.main import app
import random
import string

client = TestClient(app)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_recruitment_full_lifecycle():
    # 1. Sign up as HR admin
    email = f"hr_admin_{random_string()}@testcompany.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "SecurePassword123!",
        "firstName": "HR",
        "lastName": "Admin",
        "fullName": "HR Admin",
        "companyName": f"Recruit Corp {random_string().upper()}",
        "domain": f"recruit_{random_string()}.com"
    })
    assert signup_res.status_code == 201, signup_res.text
    token = signup_res.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initialize settings
    client.post("/api/v1/settings/initialize", json={}, headers=headers)

    # 3. Create Hiring Plan
    plan_res = client.post("/api/v1/recruitment/hiring-plans", json={
        "departmentName": "Engineering",
        "positionTitle": "Senior Backend Engineer",
        "hiringCount": 2,
        "budget": 3000000.0,
        "quarter": "Q3-2026",
        "priority": "high"
    }, headers=headers)
    assert plan_res.status_code == 201, plan_res.text

    # 4. Create Job Requisition
    req_res = client.post("/api/v1/recruitment/requisitions", json={
        "title": "Senior Backend Engineer",
        "departmentName": "Engineering",
        "openPositions": 2,
        "salaryRange": "12-20 LPA",
        "budget": 3000000.0
    }, headers=headers)
    assert req_res.status_code == 201, req_res.text
    req_id = req_res.json()["data"]["id"]

    # 5. Approve Requisition
    approve_res = client.post(f"/api/v1/recruitment/requisitions/{req_id}/approve",
                              json={"status": "approved"}, headers=headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["status"] == "approved"

    # 6. Create Job Posting
    job_res = client.post("/api/v1/recruitment/jobs", json={
        "requisitionId": req_id,
        "title": "Senior Backend Engineer",
        "departmentName": "Engineering",
        "location": "Bangalore",
        "employmentType": "full_time",
        "experienceYears": 4,
        "skills": "python,fastapi,postgresql,docker",
        "description": "We are looking for a senior backend engineer..."
    }, headers=headers)
    assert job_res.status_code == 201, job_res.text
    job_id = job_res.json()["data"]["id"]

    # 7. Candidate Application
    apply_res = client.post("/api/v1/recruitment/apply", json={
        "fullName": "Alice Johnson",
        "email": f"alice_{random_string()}@candidate.com",
        "phone": "+91 98765 43210",
        "currentCompany": "Tech Corp",
        "currentCtc": 1200000.0,
        "expectedCtc": 1800000.0,
        "noticePeriod": 30,
        "preferredLocation": "Bangalore",
        "jobPostingId": job_id,
        "resumeText": "Senior Python developer with FastAPI, PostgreSQL, Docker, and 5 years experience"
    }, headers=headers)
    assert apply_res.status_code == 201, apply_res.text
    candidate_id = apply_res.json()["data"]["id"]
    candidate_skills = apply_res.json()["data"]["skills"]
    assert len(candidate_skills) > 0, "Skills should be auto-extracted from resume text"

    # 8. Calculate ATS Score
    ats_res = client.post("/api/v1/recruitment/ats-score", json={
        "candidateId": candidate_id,
        "jobPostingId": job_id
    }, headers=headers)
    assert ats_res.status_code == 200, ats_res.text
    ats_data = ats_res.json()["data"]
    assert "atsScore" in ats_data
    assert "matchedSkills" in ats_data
    assert "missingSkills" in ats_data

    # 9. Move candidate pipeline to screening
    move_res = client.post("/api/v1/recruitment/candidates/move-pipeline", json={
        "candidateId": candidate_id,
        "newStatus": "screening"
    }, headers=headers)
    assert move_res.status_code == 200
    assert move_res.json()["data"]["status"] == "screening"

    # 10. Schedule Technical Interview
    interview_res = client.post("/api/v1/recruitment/interview", json={
        "candidateId": candidate_id,
        "title": "Technical Round 1",
        "type": "technical",
        "scheduledAt": "2026-08-01T10:00:00",
        "videoLink": "https://meet.google.com/test-link"
    }, headers=headers)
    assert interview_res.status_code == 201, interview_res.text
    interview_id = interview_res.json()["data"]["id"]

    # 11. Submit Interview Feedback
    feedback_res = client.post("/api/v1/recruitment/interview/feedback", json={
        "interviewId": interview_id,
        "interviewerName": "Bob Smith",
        "technicalRating": 4,
        "communicationRating": 4,
        "problemSolvingRating": 5,
        "culturalFitRating": 4,
        "comments": "Excellent candidate, strong Python skills",
        "recommendation": "hire"
    }, headers=headers)
    assert feedback_res.status_code == 201, feedback_res.text
    assert feedback_res.json()["data"]["recommendation"] == "hire"

    # 12. Move to Selected
    client.post("/api/v1/recruitment/candidates/move-pipeline", json={
        "candidateId": candidate_id,
        "newStatus": "selected"
    }, headers=headers)

    # 13. Create Offer
    offer_res = client.post("/api/v1/recruitment/offer", json={
        "candidateId": candidate_id,
        "jobTitle": "Senior Backend Engineer",
        "ctc": 1800000.0,
        "fixedPay": 1500000.0,
        "variablePay": 300000.0,
        "joiningDate": "2026-09-01"
    }, headers=headers)
    assert offer_res.status_code == 201, offer_res.text
    offer_id = offer_res.json()["data"]["id"]

    # 14. Approve Offer
    approve_offer_res = client.post("/api/v1/recruitment/offers/approve", json={
        "offerId": offer_id,
        "status": "approved",
        "comments": "Approved by HR Head"
    }, headers=headers)
    assert approve_offer_res.status_code == 200
    assert approve_offer_res.json()["data"]["status"] == "approved"

    # 15. Candidate accepts offer
    respond_res = client.post(f"/api/v1/recruitment/offers/{offer_id}/respond",
                              json={"response": "accepted"}, headers=headers)
    assert respond_res.status_code == 200
    assert respond_res.json()["data"]["status"] == "accepted"

    # 16. Background Verification
    bgv_res = client.post("/api/v1/recruitment/background-check", json={
        "candidateId": candidate_id,
        "identityStatus": "passed",
        "educationStatus": "passed",
        "employmentStatus": "passed",
        "criminalStatus": "passed",
        "referenceStatus": "passed"
    }, headers=headers)
    assert bgv_res.status_code == 201, bgv_res.text
    assert bgv_res.json()["data"]["overallStatus"] == "passed"

    # 17. Convert to HRMS Employee
    convert_res = client.post("/api/v1/recruitment/convert", json={
        "candidateId": candidate_id,
        "departmentName": "Engineering",
        "designationName": "Senior Backend Engineer",
        "dateOfJoining": "2026-09-01",
        "workEmail": f"alice.johnson_{random_string()}@company.com"
    }, headers=headers)
    assert convert_res.status_code == 201, convert_res.text
    emp_data = convert_res.json()["data"]
    assert emp_data["status"] == "active"
    assert emp_data["fullName"] == "Alice Johnson"

    # 18. Verify candidate status is now "hired"
    cand_res = client.get(f"/api/v1/recruitment/candidates/{candidate_id}", headers=headers)
    assert cand_res.status_code == 200
    assert cand_res.json()["data"]["status"] == "hired"

    # 19. Check timeline
    timeline_res = client.get(f"/api/v1/recruitment/candidates/{candidate_id}/timeline", headers=headers)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()["data"]
    assert len(timeline) >= 5  # multiple events expected

    # 20. Dashboard check
    dash_res = client.get("/api/v1/recruitment/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()["data"]
    assert "totalCandidates" in dash
    assert "pipelineDistribution" in dash

    # 21. AI Resume Parsing
    parse_res = client.post("/api/v1/recruitment/parse-resume", json={
        "resumeText": "Experienced Developer with AWS Certified, Java, TypeScript, and B.Tech in CS. 6 years experience."
    }, headers=headers)
    assert parse_res.status_code == 201, parse_res.text
    parse_data = parse_res.json()["data"]
    assert "detectedDegree" in parse_data
    assert "AWS Certified" in parse_data["certifications"]
    assert "EstimatedExperienceYears" in parse_data or "estimatedExperienceYears" in parse_data

    # 22. Candidate Fuzzy Search & Pagination
    search_res = client.get("/api/v1/recruitment/candidates/search?q=Alice&page=1&pageSize=10", headers=headers)
    assert search_res.status_code == 200, search_res.text
    search_data = search_res.json()["data"]
    assert "candidates" in search_data
    assert "total" in search_data
    assert len(search_data["candidates"]) > 0

    # 23. Add Candidate Reference
    ref_res = client.post(f"/api/v1/recruitment/candidates/{candidate_id}/references", json={
        "candidateId": candidate_id,
        "referenceName": "John Doe",
        "referenceCompany": "Google",
        "relationshipType": "manager"
    }, headers=headers)
    assert ref_res.status_code == 201, ref_res.text
    ref_id = ref_res.json()["data"]["id"]

    # 24. Verify Reference
    verify_res = client.post("/api/v1/recruitment/references/verify", json={
        "referenceId": ref_id,
        "outcome": "positive"
    }, headers=headers)
    assert verify_res.status_code == 200, verify_res.text
    assert verify_res.json()["data"]["status"] == "passed"

    # 25. Analytics
    analytics_res = client.get("/api/v1/recruitment/analytics", headers=headers)
    assert analytics_res.status_code == 200, analytics_res.text
    assert "offerAcceptanceRate" in analytics_res.json()["data"]

    # 26. Reports
    reports_res = client.get("/api/v1/recruitment/reports?report_type=source", headers=headers)
    assert reports_res.status_code == 200, reports_res.text
    assert reports_res.json()["data"]["reportType"] == "Hiring Source Report"

