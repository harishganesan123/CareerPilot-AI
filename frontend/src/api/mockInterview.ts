import apiClient from './client'

export type InterviewType = 'technical' | 'behavioral' | 'mixed'
export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced'
export interface InterviewOptions { roles: string[]; interview_types: InterviewType[]; difficulties: InterviewDifficulty[] }
export interface InterviewQuestion { question: string; topic: string; what_to_cover: string[] }
export interface AnswerEvaluation { score: number; rating: 'Needs improvement' | 'Developing' | 'Good' | 'Strong'; strengths: string[]; improvements: string[]; suggested_answer: string; concise_tip: string }
export interface InterviewAnswerRecord { question: string; answer: string; score: number; feedback_summary: string }
export interface InterviewSummary { overall_score: number; performance_level: 'Needs more practice' | 'Developing' | 'Interview ready' | 'Strong performance'; key_strengths: string[]; priority_improvements: string[]; practice_plan: string[]; closing_note: string }
export async function fetchMockInterviewOptions() { return (await apiClient.get<InterviewOptions>('/mock-interview/options')).data }
export async function generateInterviewQuestions(input: { role: string; interview_type: InterviewType; difficulty: InterviewDifficulty; question_count: number }) { return (await apiClient.post<{ questions: InterviewQuestion[] }>('/mock-interview/questions', input, { timeout: 45000 })).data }
export async function evaluateInterviewAnswer(input: { role: string; interview_type: InterviewType; difficulty: InterviewDifficulty; question: string; answer: string }) { return (await apiClient.post<AnswerEvaluation>('/mock-interview/evaluate', input, { timeout: 45000 })).data }
export async function summarizeMockInterview(input: { role: string; interview_type: InterviewType; difficulty: InterviewDifficulty; answers: InterviewAnswerRecord[] }) { return (await apiClient.post<InterviewSummary>('/mock-interview/summary', input, { timeout: 45000 })).data }
