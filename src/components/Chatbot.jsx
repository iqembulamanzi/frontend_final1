import React, { useState, useEffect } from "react";
import { reportIncident } from "../api";
import './Chatbot.css';

const Chatbot = () => {
  const [comment, setComment] = useState("");
  const [reportType, setReportType] = useState("sewage");
  const [level, setLevel] = useState("P2");
  const [location, setLocation] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get user's geolocation when the component loads
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocation(null); // Explicitly set location to null if permission is denied.
        }
      );
    }
  }, []);

  // Handle media file selection
  const handleFileChange = (event) => {
    setMediaFile(event.target.files[0]);
  };

  // Handle voice recording
  const toggleRecording = () => {
    if (isRecording) {
      if (recorder) {
        recorder.stop();
        setIsRecording(false);
      }
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const newRecorder = new MediaRecorder(stream);
          setRecorder(newRecorder);
          const chunks = [];
          newRecorder.ondataavailable = (e) => chunks.push(e.data);
          newRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
            const url = URL.createObjectURL(blob);
            setAudioURL(url);
            setMediaFile(blob);
          };
          newRecorder.start();
          setIsRecording(true);
        })
        .catch((err) => {
          console.error("Could not access microphone:", err);
        });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('description', comment);
      formData.append('category', reportType);
      formData.append('priority', level);

      if (location) {
        formData.append('latitude', location.latitude.toString());
        formData.append('longitude', location.longitude.toString());
      }

      if (mediaFile) {
        formData.append('image', mediaFile);
      }

      await reportIncident(formData);

      setSuccess(true);
      // Reset form
      setComment("");
      setReportType("sewage");
      setLevel("P2");
      setMediaFile(null);
      setAudioURL(null);

    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>New Report</h2>
        <p>Hello! What would you like to report?</p>
        <p>You can select a report type below and add details, including a picture or a voice message.</p>
        {location && (
          <p>Your location has been captured: Lat {location.latitude.toFixed(2)}, Lon {location.longitude.toFixed(2)}.</p>
        )}
      </div>

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="report-type">Report Type</label>
          <select id="report-type" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="sewage">Sewage Issue</option>
            <option value="manhole_overflow">Manhole Overflow</option>
            <option value="pipe_burst">Pipe Burst</option>
            <option value="toilet_backup">Toilet Backup</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Priority Level</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="level" value="P0" checked={level === "P0"} onChange={(e) => setLevel(e.target.value)} />
              Critical (P0)
            </label>
            <label>
              <input type="radio" name="level" value="P1" checked={level === "P1"} onChange={(e) => setLevel(e.target.value)} />
              High (P1)
            </label>
            <label>
              <input type="radio" name="level" value="P2" checked={level === "P2"} onChange={(e) => setLevel(e.target.value)} />
              Medium (P2)
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comments</label>
          <textarea
            id="comment"
            placeholder="Add detailed comments here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>

        <div className="button-group">
          <label htmlFor="media-upload" className="media-button">
            Take Picture/Video
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              capture="camera"
              onChange={handleFileChange}
              className="hidden-input"
            />
          </label>
          <button
            type="button"
            className={`media-button ${isRecording ? "recording-active" : ""}`}
            onClick={toggleRecording}
          >
            {isRecording ? "Stop Recording" : "Record Voice Note"}
          </button>
        </div>
        
        {mediaFile && (
          <div className="file-preview">
            <span>Selected File: {mediaFile.name}</span>
            {audioURL && (
              <audio controls className="audio-player">
                <source src={audioURL} type="audio/ogg" />
              </audio>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Report submitted successfully! A maintenance team will be notified.</div>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default Chatbot;