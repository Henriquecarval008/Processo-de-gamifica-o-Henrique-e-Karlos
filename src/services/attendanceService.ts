/**
 * Attendance Service for GAMEINFOR (Instituto Ambiente)
 * 
 * Manages:
 * - Class sessions (date, time, class, topic, status)
 * - Attendance rosters (presente, ausente, justificado)
 * - Automated calculation of attendance rates, absences, and justifications
 * - History per student and per class
 * - Integration with NEXUS virtual assistant (voice/text guidance with teacher confirmation)
 */

import {
  ClassSession,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceStats,
} from '../types';
import { initialUsers, initialClasses } from '../data/initialData';

const SESSIONS_STORAGE_KEY = 'gameinfor_class_sessions_v1';
const ATTENDANCE_STORAGE_KEY = 'gameinfor_attendance_records_v1';

class AttendanceService {
  private sessions: ClassSession[] = [];
  private records: AttendanceRecord[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.sessions.length === 0) {
      this.seedInitialAttendanceData();
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const sessData = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (sessData) this.sessions = JSON.parse(sessData);

      const recData = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (recData) this.records = JSON.parse(recData);
    } catch (e) {
      console.warn('Erro ao carregar dados de frequência:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(this.sessions));
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Erro ao salvar dados de frequência:', e);
    }
  }

  private seedInitialAttendanceData() {
    // Generate realistic historical sessions for Turma Alpha & Turma Beta
    const defaultSessions: ClassSession[] = [
      {
        id: 'sess-1',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        projectId: 'proj-crescer-transformar',
        projectName: 'Crescer e Transformar',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        date: '2026-02-16',
        time: '09:00',
        topic: 'Introdução ao Sistema Operacional Windows e Gestão de Arquivos',
        status: 'concluida',
        createdAt: '2026-02-16T08:30:00Z',
        recordedBy: 'Instrutor Henrique',
        recordedAt: '2026-02-16T10:15:00Z',
      },
      {
        id: 'sess-2',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        projectId: 'proj-crescer-transformar',
        projectName: 'Crescer e Transformar',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        date: '2026-02-23',
        time: '09:00',
        topic: 'Fundamentos do Microsoft Word: Formatação e Normas Básicas',
        status: 'concluida',
        createdAt: '2026-02-23T08:30:00Z',
        recordedBy: 'Instrutor Henrique',
        recordedAt: '2026-02-23T10:10:00Z',
      },
      {
        id: 'sess-3',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        projectId: 'proj-crescer-transformar',
        projectName: 'Crescer e Transformar',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        date: '2026-03-02',
        time: '09:00',
        topic: 'Excel Básico: Estrutura de Células, Operações Aritméticas e SOMA',
        status: 'concluida',
        createdAt: '2026-03-02T08:30:00Z',
        recordedBy: 'Instrutor Henrique',
        recordedAt: '2026-03-02T10:05:00Z',
      },
      {
        id: 'sess-4',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        projectId: 'proj-crescer-transformar',
        projectName: 'Crescer e Transformar',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        date: '2026-03-09',
        time: '09:00',
        topic: 'Excel Intermediário: Fórmulas MÉDIA, SE e Formatação Condicional',
        status: 'concluida',
        createdAt: '2026-03-09T08:30:00Z',
        recordedBy: 'Instrutor Henrique',
        recordedAt: '2026-03-09T10:20:00Z',
      },
      {
        id: 'sess-5',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        projectId: 'proj-crescer-transformar',
        projectName: 'Crescer e Transformar',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        date: '2026-03-16',
        time: '09:00',
        topic: 'Segurança Digital, Navegação Segura e Prevenção a Phishing',
        status: 'concluida',
        createdAt: '2026-03-16T08:30:00Z',
        recordedBy: 'Instrutor Henrique',
        recordedAt: '2026-03-16T10:12:00Z',
      },
    ];

    this.sessions = defaultSessions;

    // Seed attendance records for alpha students
    const alphaStudents = initialUsers.filter((u) => u.role === 'aluno' && u.classId === 'turma-1');
    const recordsList: AttendanceRecord[] = [];

    defaultSessions.forEach((sess) => {
      alphaStudents.forEach((student, index) => {
        let st: AttendanceStatus = 'presente';
        let just: string | undefined = undefined;

        // Realistic variation: some absences or justified medical notes
        if (sess.id === 'sess-2' && index === 2) {
          st = 'justificado';
          just = 'Atestado médico odontológico apresentado à coordenação';
        } else if (sess.id === 'sess-4' && index === 1) {
          st = 'ausente';
        }

        recordsList.push({
          id: `rec-${sess.id}-${student.id}`,
          sessionId: sess.id,
          classId: sess.classId,
          studentId: student.id,
          studentName: student.name,
          studentNickname: student.nickname,
          studentAvatar: student.avatar,
          status: st,
          justification: just,
          recordedAt: sess.recordedAt || new Date().toISOString(),
          recordedBy: sess.recordedBy || 'Instrutor Henrique',
        });
      });
    });

    this.records = recordsList;
    this.saveToStorage();
  }

  // SESSIONS
  public getSessions(classId?: string): ClassSession[] {
    if (classId) {
      return this.sessions.filter((s) => s.classId === classId);
    }
    return [...this.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getSessionById(sessionId: string): ClassSession | undefined {
    return this.sessions.find((s) => s.id === sessionId);
  }

  public createSession(data: Omit<ClassSession, 'id' | 'createdAt'>): ClassSession {
    const newSession: ClassSession = {
      ...data,
      id: `sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.sessions.unshift(newSession);
    this.saveToStorage();
    return newSession;
  }

  public updateSession(sessionId: string, updates: Partial<ClassSession>): ClassSession | undefined {
    const idx = this.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return undefined;
    this.sessions[idx] = { ...this.sessions[idx], ...updates };
    this.saveToStorage();
    return this.sessions[idx];
  }

  // RECORDS
  public getRecordsBySession(sessionId: string): AttendanceRecord[] {
    return this.records.filter((r) => r.sessionId === sessionId);
  }

  public getRecordsByStudent(studentId: string): AttendanceRecord[] {
    return this.records.filter((r) => r.studentId === studentId);
  }

  public saveSessionAttendance(
    sessionId: string,
    recordsToSave: Array<{
      studentId: string;
      studentName: string;
      studentNickname?: string;
      studentAvatar?: string;
      status: AttendanceStatus;
      justification?: string;
    }>,
    recordedBy: string
  ): void {
    const session = this.getSessionById(sessionId);
    if (!session) throw new Error('Aula não encontrada.');

    const now = new Date().toISOString();

    recordsToSave.forEach((item) => {
      const existingIdx = this.records.findIndex(
        (r) => r.sessionId === sessionId && r.studentId === item.studentId
      );

      const record: AttendanceRecord = {
        id: existingIdx !== -1 ? this.records[existingIdx].id : `rec-${sessionId}-${item.studentId}`,
        sessionId,
        classId: session.classId,
        studentId: item.studentId,
        studentName: item.studentName,
        studentNickname: item.studentNickname,
        studentAvatar: item.studentAvatar,
        status: item.status,
        justification: item.justification,
        recordedAt: now,
        recordedBy,
      };

      if (existingIdx !== -1) {
        this.records[existingIdx] = record;
      } else {
        this.records.push(record);
      }
    });

    // Mark session as completed
    this.updateSession(sessionId, {
      status: 'concluida',
      recordedBy,
      recordedAt: now,
    });

    this.saveToStorage();
  }

  // STATS CALCULATOR
  public getStudentAttendanceStats(studentId: string): StudentAttendanceStats {
    const studentRecords = this.records.filter((r) => r.status !== undefined && r.studentId === studentId);
    const studentName = studentRecords[0]?.studentName || 'Aluno';

    const totalSessions = studentRecords.length;
    const presentCount = studentRecords.filter((r) => r.status === 'presente').length;
    const absentCount = studentRecords.filter((r) => r.status === 'ausente').length;
    const justifiedCount = studentRecords.filter((r) => r.status === 'justificado').length;

    // Presenças + faltas justificadas contam para taxa efetiva de comparecimento/amparo legal
    const effectivePresent = presentCount + justifiedCount;
    const attendancePercentage = totalSessions > 0 ? Math.round((effectivePresent / totalSessions) * 100) : 100;

    return {
      studentId,
      studentName,
      totalSessions,
      presentCount,
      absentCount,
      justifiedCount,
      attendancePercentage,
    };
  }

  public getClassAttendanceSummary(classId: string): {
    totalSessions: number;
    avgAttendancePercent: number;
    studentsStats: StudentAttendanceStats[];
  } {
    const classSessions = this.sessions.filter((s) => s.classId === classId && s.status === 'concluida');
    const classRecords = this.records.filter((r) => r.classId === classId);

    const studentIds = Array.from(new Set(classRecords.map((r) => r.studentId)));
    const studentsStats = studentIds.map((id) => this.getStudentAttendanceStats(id));

    const totalPercent = studentsStats.reduce((acc, s) => acc + s.attendancePercentage, 0);
    const avgAttendancePercent = studentsStats.length > 0 ? Math.round(totalPercent / studentsStats.length) : 100;

    return {
      totalSessions: classSessions.length,
      avgAttendancePercent,
      studentsStats,
    };
  }
}

export const attendanceService = new AttendanceService();
