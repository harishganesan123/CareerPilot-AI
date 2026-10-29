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

/** Modules that exist in the navigation but aren't built yet. */
const comingSoon: { path: string; title: string; description: string; plannedFor: string }[] = [
  
  {
    path: '/ai/career-recommendations',
    title: 'Career Recommendations',
    description: 'Find career paths that match your profile and interests.',
    plannedFor: 'a later phase',
  },
  {
    path: '/placement/interview-prep',
    title: 'Interview Prep',
    description: 'Practice for interviews with structured preparation tracks.',
    plannedFor: 'a later phase',
  },
  {
    path: '/placement/readiness',
    title: 'Placement Readiness',
    description:
      'A readiness indicator calculated from your profile, skills, and practice history.',
    plannedFor: 'a later phase',
  },
  {
    path: '/settings',
    title: 'Settings',
    description: 'Account and application preferences.',
    plannedFor: 'a later phase',
  },
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
