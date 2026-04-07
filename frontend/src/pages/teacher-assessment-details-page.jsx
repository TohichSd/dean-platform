import {useEffect, useMemo, useState} from "preact/hooks";
import {useLocation} from "wouter-preact";
import {PageTitle} from "../components/common/page-title";
import {getAssessment, getAssessmentStudents, updateAttemptResult,} from "../api/assessments";

export function TeacherAssessmentDetailsPage({params}) {
    const assessmentId = params?.id;
    const [, navigate] = useLocation();

    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [assessmentData, studentsData] = await Promise.all([
                getAssessment(assessmentId),
                getAssessmentStudents(assessmentId),
            ]);

            setAssessment(assessmentData);
            setStudents(studentsData);

            const initialDrafts = {};
            studentsData.forEach((item) => {
                initialDrafts[item.attempt_id] = {
                    result_value: item.result_value ?? "",
                    is_absent: item.is_absent,
                };
            });
            setDrafts(initialDrafts);
        } catch (err) {
            setError(err.message || "Не удалось загрузить аттестацию");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (assessmentId) {
            loadData();
        }
    }, [assessmentId]);

    function updateDraft(attemptId, patch) {
        setDrafts((prev) => ({
            ...prev,
            [attemptId]: {
                ...prev[attemptId],
                ...patch,
            },
        }));
    }

    async function handleSave(attemptId) {
        const draft = drafts[attemptId];

        try {
            setSavingId(attemptId);
            setError("");

            const payload = {
                result_value:
                    draft.is_absent || draft.result_value === ""
                        ? null
                        : Number(draft.result_value),
                is_absent: draft.is_absent,
            };

            const updated = await updateAttemptResult(attemptId, payload);

            setStudents((prev) =>
                prev.map((item) =>
                    item.attempt_id === attemptId ? updated : item
                )
            );

            setDrafts((prev) => ({
                ...prev,
                [attemptId]: {
                    result_value: updated.result_value ?? "",
                    is_absent: updated.is_absent,
                },
            }));
        } catch (err) {
            setError(err.message || "Не удалось сохранить результат");
        } finally {
            setSavingId(null);
        }
    }

    const assessmentStats = useMemo(() => {
        let count5 = 0;
        let count4 = 0;
        let count3 = 0;
        let count2 = 0;
        let absentCount = 0;
        let gradedSum = 0;
        let gradedCount = 0;

        for (const item of students) {
            if (item.is_absent) {
                absentCount += 1;
                continue;
            }

            if (item.result_value === 5) {
                count5 += 1;
                gradedSum += 5;
                gradedCount += 1;
            } else if (item.result_value === 4) {
                count4 += 1;
                gradedSum += 4;
                gradedCount += 1;
            } else if (item.result_value === 3) {
                count3 += 1;
                gradedSum += 3;
                gradedCount += 1;
            } else if (item.result_value === 2) {
                count2 += 1;
                gradedSum += 2;
                gradedCount += 1;
            }
        }

        return {
            count5,
            count4,
            count3,
            count2,
            absentCount,
            averageScore:
                gradedCount > 0 ? (gradedSum / gradedCount).toFixed(2) : "—",
        };
    }, [students]);
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) =>
            a.student_name.localeCompare(b.student_name, "ru")
        );
    }, [students]);

    if (loading) {
        return <div className="empty-state">Загрузка аттестации...</div>;
    }

    if (!assessment) {
        return <div className="empty-state">Аттестация не найдена</div>;
    }

    return (
        <section className="section-stack">
            <div className="page-top-actions">
                <button
                    className="secondary-button"
                    onClick={() => navigate("/teacher/assessments")}
                >
                    ← Назад к моим аттестациям
                </button>
            </div>

            <PageTitle
                title={`Аттестация №${assessment.assessment_id}`}
                subtitle="Выставление результатов"
            />

            {error && <div className="error-box page-error-box">{error}</div>}

            <div className="exam-card exam-card--details">
                <div className="exam-card__grid">
                    <div className="exam-info-item">
                        <span className="exam-info-label">Предмет</span>
                        <span className="exam-info-value">{assessment.subject_name || "—"}</span>
                    </div>

                    <div className="exam-info-item">
                        <span className="exam-info-label">Группа</span>
                        <span className="exam-info-value">{assessment.group_name || "—"}</span>
                    </div>

                    <div className="exam-info-item">
                        <span className="exam-info-label">Тип</span>
                        <span className="exam-info-value">
              {assessment.is_exam ? "Экзамен" : "Зачёт"}
            </span>
                    </div>

                    <div className="exam-info-item">
                        <span className="exam-info-label">Дата и время</span>
                        <span className="exam-info-value">
              {new Date(assessment.assessment_dt).toLocaleString()}
            </span>
                    </div>

                    <div className="exam-info-item">
                        <span className="exam-info-label">Статус</span>
                        <span className="exam-info-value">
              {assessment.is_retake ? "Пересдача" : "Обычная аттестация"}
            </span>
                    </div>
                </div>
            </div>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__label">Оценок 5</div>
                    <div className="stat-card__value">{assessmentStats.count5}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__label">Оценок 4</div>
                    <div className="stat-card__value">{assessmentStats.count4}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__label">Оценок 3</div>
                    <div className="stat-card__value">{assessmentStats.count3}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__label">Оценок 2</div>
                    <div className="stat-card__value">{assessmentStats.count2}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__label">Неявок</div>
                    <div className="stat-card__value">{assessmentStats.absentCount}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__label">Средний балл</div>
                    <div className="stat-card__value">{assessmentStats.averageScore}</div>
                </div>
            </div>

            <div className="table-card">
                <div className="card-toolbar">
                    <h2>Студенты</h2>
                </div>

                <table className="data-table">
                    <thead>
                    <tr>
                        <th>ID попытки</th>
                        <th>Студент</th>
                        <th>{assessment.is_exam ? "Оценка" : "Результат"}</th>
                        <th>Неявка</th>
                        <th>Текущее значение</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedStudents.length > 0 ? (
                        sortedStudents.map((item) => {
                            const draft = drafts[item.attempt_id] || {
                                result_value: "",
                                is_absent: false,
                            };

                            return (
                                <tr key={item.attempt_id}>
                                    <td>{item.attempt_id}</td>
                                    <td>{item.student_name}</td>

                                    <td>
                                        <select
                                            className="text-input inline-input"
                                            value={draft.result_value}
                                            disabled={draft.is_absent}
                                            onChange={(e) =>
                                                updateDraft(item.attempt_id, {
                                                    result_value: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="">—</option>
                                            {assessment.is_exam ? (
                                                <>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="2">Не зачтено</option>
                                                    <option value="5">Зачтено</option>
                                                </>
                                            )}
                                        </select>
                                    </td>

                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={draft.is_absent}
                                            onChange={(e) =>
                                                updateDraft(item.attempt_id, {
                                                    is_absent: e.target.checked,
                                                    result_value: e.target.checked ? "" : draft.result_value,
                                                })
                                            }
                                        />
                                    </td>

                                    <td>
                      <span
                          className={
                              item.is_absent
                                  ? "badge badge--red"
                                  : item.display_value === "Зачтено"
                                      ? "badge badge--green"
                                      : item.display_value === "Не зачтено"
                                          ? "badge badge--red"
                                          : "badge badge--blue"
                          }
                      >
                        {item.display_value}
                      </span>
                                    </td>

                                    <td className="actions-cell">
                                        <button
                                            className="primary-button"
                                            onClick={() => handleSave(item.attempt_id)}
                                            disabled={savingId === item.attempt_id}
                                        >
                                            {savingId === item.attempt_id ? "Сохранение..." : "Сохранить"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="6">
                                <div className="empty-state">Студенты не найдены</div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}