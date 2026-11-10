import { AUTHENTICATION_ENABLED } from "./lib/auth-config";
import Portal from "./portal/Portal";
import StudentDashboard from "./portal/dashboards/StudentDashboard";
import {
  demoChallenges,
  demoActivities,
  demoProfile,
  demoSubmissions,
  demoWork,
} from "./lib/demo-data";

export default function Home() {
  if (AUTHENTICATION_ENABLED && process.env.NODE_ENV !== "development") {
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
