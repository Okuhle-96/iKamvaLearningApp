import { AUTHENTICATION_ENABLED } from "../lib/auth-config";
import {
  demoActivities,
  demoChallenges,
  demoProfile,
  demoSubmissions,
  demoWork,
} from "../lib/demo-data";
import Portal from "../portal/Portal";
import StudentDashboard from "../portal/dashboards/StudentDashboard";

export default function LoginPage() {
  if (AUTHENTICATION_ENABLED) {
    return <Portal dashboard="student" />;
  }

  return (
    <StudentDashboard
      profile={demoProfile}
      preview={{
        activities: demoActivities,
        challenges: demoChallenges,
        work: demoWork,
        submissions: demoSubmissions,
      }}
    />
  );
}
