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
import ComingSoonPage from '../pages/ComingSoonPage'
import ProtectedRoute from '../components/auth/ProtectedRoute'

/** Modules that exist in the navigation but aren't built yet. */
const comingSoon: { path: string; title: string; description: string; plannedFor: string }[] = [
  {
    path: '/ai/assistant',
    title: 'AI Academic Assistant',
    description: 'Ask questions from your own study materials and get grounded answers.',
    plannedFor: 'a later phase',
  },
  {
    path: '/ai/study-planner',
    title: 'Smart Study Planner',
    description: 'Build a personalized learning schedule around your semester and goals.',
    plannedFor: 'a later phase',
  },
  {
    path: '/ai/resume-analyzer',
    title: 'Resume Analyzer',
    description: 'Analyze your resume and identify concrete improvements.',
    plannedFor: 'a later phase',
  },
  {
    path: '/ai/skill-gap',
    title: 'Skill Gap Analysis',
    description: 'Discover which skills you still need for your target role.',
    plannedFor: 'a later phase',
  },
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
