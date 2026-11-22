
import { useState } from 'react';
import { UserRound, ArrowRight } from 'lucide-react';

function LifestyleProfile({ onSubmit }) {
  const [profile, setProfile] = useState({
    activity: 'student',
    commute: 'two-wheeler',
    sensitivity: 'none',
    outdoorTime: '2-4',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(profile);
  };

  return (
    <section className="lifestyle-profile">
      <div className="profile-heading">
        <div className="profile-icon">
          <UserRound size={23} />
        </div>

        <div>
          <span className="profile-label">PERSONALIZATION</span>
          <h2>Your Lifestyle Profile</h2>
          <p>Help us understand your daily routine.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="profile-fields">
          <div className="profile-field">
            <label htmlFor="activity">What best describes you?</label>
            <select
              id="activity"
              name="activity"
              value={profile.activity}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="working-professional">
                Working professional
              </option>
              <option value="remote-worker">Remote worker</option>
              <option value="outdoor-worker">Outdoor worker</option>
              <option value="homemaker">Homemaker</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="profile-field">
            <label htmlFor="commute">How do you usually commute?</label>
            <select
              id="commute"
              name="commute"
              value={profile.commute}
              onChange={handleChange}
            >
              <option value="two-wheeler">Two-wheeler</option>
              <option value="car">Car</option>
              <option value="public-transport">Public transport</option>
              <option value="walking">Walking</option>
              <option value="cycling">Cycling</option>
              <option value="work-from-home">I work from home</option>
            </select>
          </div>

          <div className="profile-field">
            <label htmlFor="sensitivity">
              Do you have any respiratory sensitivity?
            </label>
            <select
              id="sensitivity"
              name="sensitivity"
              value={profile.sensitivity}
              onChange={handleChange}
            >
              <option value="none">None known</option>
              <option value="asthma">Asthma</option>
              <option value="allergies">Respiratory allergies</option>
              <option value="other">Other sensitivity</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="profile-field">
            <label htmlFor="outdoorTime">
              How much time do you spend outdoors daily?
            </label>
            <select
              id="outdoorTime"
              name="outdoorTime"
              value={profile.outdoorTime}
              onChange={handleChange}
            >
              <option value="less-than-1">Less than 1 hour</option>
              <option value="1-2">1–2 hours</option>
              <option value="2-4">2–4 hours</option>
              <option value="more-than-4">More than 4 hours</option>
            </select>
          </div>
        </div>

        <button type="submit" className="profile-submit">
          Generate My Recommendations
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="profile-note">
        Your responses help personalize general air-quality guidance.
        This is not a medical assessment.
      </p>
    </section>
  );
}

export default LifestyleProfile;
