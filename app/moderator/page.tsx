import { AUTHENTICATION_ENABLED } from "../lib/auth-config";
import Portal from "../portal/Portal";
import ModeratorDashboard from "../portal/dashboards/ModeratorDashboard";
import {
  demoActivities,
  demoChallenges,
  demoModeratorProfile,
  demoReviewSubmissions,
  demoStudents,
  demoSubmissions,
} from "../lib/demo-data";

export default function ModeratorPage() {
  if (AUTHENTICATION_ENABLED && process.env.NODE_ENV !== "development") {
    return <Portal dashboard="moderator" />;
  }

  return (
    <ModeratorDashboard
      profile={demoModeratorProfile}
      preview={{
        students: demoStudents,
        challenges: demoChallenges,
        activities: demoActivities,
        submissions: demoSubmissions,
        reviewSubmissions: demoReviewSubmissions,
      }}
    />
  );
}
