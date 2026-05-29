import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "https://devconnect-api-hwvw.onrender.com";


import MainLayout from "../layouts/MainLayout";

function Recruiter() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    activeJobs: 0,
    topSkills: [],
  });

  const [jobs, setJobs] = useState([]);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Remote");
  const [jobType, setJobType] = useState("Full-time");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");

  const [messageText, setMessageText] = useState({});

  const fetchJobs = async () => {
    const response = await axios.get(
      "https://devconnect-api-hwvw.onrender.com/api/jobs",
    );
    setJobs(response.data);
  };

  useEffect(() => {
    fetchJobs();
    fetchAnalytics();
  }, []);

  const handleCreateJob = async () => {
    if (!title.trim() || !company.trim() || !description.trim()) {
      return alert("Title, company and description are required");
    }

    const skillsArray = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    await axios.post("https://devconnect-api-hwvw.onrender.com/api/jobs", {
      title,
      company,
      location,
      jobType,
      skills: skillsArray,
      description,
      recruiterId: user._id,
    });

    setTitle("");
    setCompany("");
    setLocation("Remote");
    setJobType("Full-time");
    setSkills("");
    setDescription("");

    fetchJobs();
    fetchAnalytics();
  };

  const handleApply = async (jobId) => {
    const response = await axios.put(
      `https://devconnect-api-hwvw.onrender.com/api/jobs/${jobId}/apply`,
      {
        userId: user._id,
      },
    );

    alert(response.data.message);
    fetchJobs();
    fetchAnalytics();
  };

  const handleDelete = async (jobId) => {
    await axios.delete(
      `https://devconnect-api-hwvw.onrender.com/api/jobs/${jobId}`,
      {
        data: {
          userId: user._id,
        },
      },
    );

    fetchJobs();
    fetchAnalytics();
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/recruiter/analytics/${user._id}`,
      );

      setAnalytics(response.data);
    } catch (error) {
      console.log("Analytics error:", error);
    }
  };

  const handleDirectMessage = async (receiverId) => {
    const text = messageText[receiverId];

    if (!text || !text.trim()) {
      return alert("Please write a message");
    }

    await axios.post(
      "https://devconnect-api-hwvw.onrender.com/api/direct-message",
      {
        senderId: user._id,
        receiverId,
        text,
      },
    );

    setMessageText({
      ...messageText,
      [receiverId]: "",
    });

    alert("Message sent");
  };

  return (
    <MainLayout>
      <div className="recruiter-page">
        <div className="job-form-card">
          <h2>Post a Job</h2>

          <input
            type="text"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Internship</option>
            <option>Remote</option>
            <option>Contract</option>
          </select>

          <input
            type="text"
            placeholder="Skills: React, Node.js, MongoDB"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />

          <textarea
            placeholder="Job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button onClick={handleCreateJob}>Publish Job</button>
        </div>

        <div className="recruiter-analytics">
          <div className="analytics-card">
            <h3>{analytics.totalJobs}</h3>
            <p>Jobs Posted</p>
          </div>

          <div className="analytics-card">
            <h3>{analytics.totalApplicants}</h3>
            <p>Total Applicants</p>
          </div>

          <div className="analytics-card">
            <h3>{analytics.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>

        <div className="top-skills-card">
          <h3>Top Applicant Skills</h3>

          {analytics.topSkills.length === 0 ? (
            <p>No applicant skills yet.</p>
          ) : (
            <div className="top-skills-list">
              {analytics.topSkills.map((item) => (
                <span key={item.skill}>
                  {item.skill} <b>{item.count}</b>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="jobs-list">
          {jobs.map((job) => {
            const alreadyApplied = job.applicants?.some(
              (applicant) => applicant._id === user._id,
            );

            const isOwner = job.recruiter?._id === user._id;

            return (
              <div className="job-card" key={job._id}>
                <div className="job-header">
                  <div>
                    <h3>{job.title}</h3>

                    <p>
                      {job.company} • {job.location} • {job.jobType}
                    </p>

                    <small>Posted by {job.recruiter?.name}</small>
                  </div>

                  {isOwner && (
                    <button
                      className="delete-job-btn"
                      onClick={() => handleDelete(job._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="job-desc">{job.description}</p>

                <div className="job-skills">
                  {job.skills?.map((skill, index) => (
                    <span key={index}>{skill}</span>
                  ))}
                </div>

                {!isOwner && (
                  <button
                    className={alreadyApplied ? "applied-btn" : "apply-btn"}
                    onClick={() => handleApply(job._id)}
                    disabled={alreadyApplied}
                  >
                    {alreadyApplied ? "✓ Applied" : "Apply Now"}
                  </button>
                )}

                {isOwner && (
                  <div className="applicants-box">
                    <h4>Applicants ({job.applicants?.length || 0})</h4>

                    {job.applicants?.length === 0 && <p>No applicants yet.</p>}

                    {job.applicants?.map((applicant) => (
                      <div
                        className="applicant-item applicant-message-card"
                        key={applicant._id}
                      >
                        <Link
                          to={`/profile/${applicant._id}`}
                          className="applicant-profile-link"
                        >
                          <div className="mini-avatar">
                            {applicant.avatar ? (
                              <img src={applicant.avatar} alt="avatar" />
                            ) : (
                              applicant.name?.charAt(0)
                            )}
                          </div>

                          <div>
                            <strong>{applicant.name}</strong>
                            <p>{applicant.role || "Developer"}</p>
                          </div>
                        </Link>

                        <div className="applicant-direct-message">
                          <input
                            type="text"
                            placeholder={`Message ${applicant.name}...`}
                            value={messageText[applicant._id] || ""}
                            onChange={(e) =>
                              setMessageText({
                                ...messageText,
                                [applicant._id]: e.target.value,
                              })
                            }
                          />

                          <button
                            onClick={() => handleDirectMessage(applicant._id)}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

export default Recruiter;
