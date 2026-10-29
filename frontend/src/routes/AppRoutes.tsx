import { Route, Routes } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ProfilePage from '../pages/ProfilePage'
import SkillsPage from '../pages/SkillsPage'
import ProjectsPage from '../pages/ProjectsPage'
import CertificationsPage from '../pages/CertificationsPage'
import CareerGoalsPage from '../pages/CareerGoalsPage'
import AIAssistantPage from '../pages/AIAssistantPage'
import StudyPlannerPage from '../pages/StudyPlannerPage'
import SkillGapPage from '../pages/SkillGapPage'
import ResumeAnalyzerPage from '../pages/ResumeAnalyzerPage'
import ComingSoonPage from '../pages/ComingSoonPage'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import MockInterviewPage from '../pages/MockInterviewPage';
import CareerRecommendationsPage from '../pages/CareerRecommendationsPage'
import PlacementReadinessPage from '../pages/PlacementReadinessPage'
import SettingsPage from '../pages/SettingsPage'


/** Modules that exist in the navigation but aren't built yet. */
const comingSoon: { path: string; title: string; description: string; plannedFor: string }[] = [
  

  
]

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <SkillsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certifications"
        element={
          <ProtectedRoute>
            <CertificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/career-goals"
        element={
          <ProtectedRoute>
            <CareerGoalsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/assistant"
        element={
          <ProtectedRoute>
            <AIAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
         path="/ai/study-planner"
        element={
          <ProtectedRoute>
            <StudyPlannerPage />
          </ProtectedRoute>
         }
      />

      <Route
        path="/ai/skill-gap"
       element={
         <ProtectedRoute>
            <SkillGapPage />
        </ProtectedRoute>
        }
      />
      <Route
        path="/ai/resume-analyzer"
       element={
        <ProtectedRoute>
            <ResumeAnalyzerPage />
        </ProtectedRoute>
        }
      />
      <Route
        path="/placement/interview-prep"
      element={
       <ProtectedRoute>
            <MockInterviewPage />
        </ProtectedRoute>
        }
      />
      <Route
        path="/ai/career-recommendations"
      element={
       <ProtectedRoute>
            <CareerRecommendationsPage />
       </ProtectedRoute>
        }
      />

      <Route
        path="/placement/readiness"
      element={
       <ProtectedRoute>
            <PlacementReadinessPage />
       </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
      element={
       <ProtectedRoute>
          <SettingsPage />
       </ProtectedRoute>
        }
      />

      {comingSoon.map((module) => (
        <Route
          key={module.path}
          path={module.path}
          element={
            <ProtectedRoute>
              <ComingSoonPage
                title={module.title}
                description={module.description}
                plannedFor={module.plannedFor}
              />
            </ProtectedRoute>
          }
        />
      ))}
    </Routes>
  )
}
