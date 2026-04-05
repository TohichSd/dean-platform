import {useEffect, useMemo, useState} from "preact/hooks";
import {useLocation} from "wouter-preact";
import {PageTitle} from "../components/common/page-title";
import {Modal} from "../components/common/modal";
import {
    assignRetake,
    getAssessment,
    getAssessmentStudents,
    getRetakeOptions,
    updateAttemptResult,
} from "../api/assessments";
import {deleteAttempt} from "../api/attempts";

export function ExamDetailsPage({params}) {
    const assessmentId = params?.id;
    const [, navigate] = useLocation();

    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");

    const [retakeOpen, setRetakeOpen] = useState(false);
    const [retakeStudent, setRetakeStudent] = useState(null);
    const [retakeOptions, setRetakeOptions] = useState([]);
    const [retakeLoading, setRetakeLoading] = useState(false);
    const [selectedRetakeId, setSelectedRetakeId] = useState("");
    const [retakeSubmitting, setRetakeSubmitting] = useState(false);
    const [removingAttemptId, setRemovingAttemptId] = useState(null);

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
            setError(err.message || "Не удалось загрузить данные аттестации");
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

    async function handleRemoveFromCurrentRetake(item) {
        const confirmed = window.confirm(
            "Убрать студента с этой пересдачи?"
        );
        if (!confirmed) return;

        try {
            setRemovingAttemptId(item.attempt_id);
            setError("");

            await deleteAttempt(item.attempt_id);

            setStudents((prev) =>
                prev.filter((student) => student.attempt_id !== item.attempt_id)
            );

            setDrafts((prev) => {
                const copy = {...prev};
                delete copy[item.attempt_id];
                return copy;
            });
        } catch (err) {
            setError(err.message || "Не удалось убрать студента с пересдачи");
        } finally {
            setRemovingAttemptId(null);
        }
    }

    async function openRetakeModal(item) {
        try {
            setRetakeOpen(true);
            setRetakeStudent(item);
            setSelectedRetakeId("");
            setRetakeOptions([]);
            setRetakeLoading(true);
            setError("");

            const options = await getRetakeOptions(assessmentId, item.student_id);
            setRetakeOptions(options);
        } catch (err) {
            setError(err.message || "Не удалось загрузить пересдачи");
        } finally {
            setRetakeLoading(false);
        }
    }

    async function handleAssignRetake() {
        if (!selectedRetakeId || !retakeStudent) {
            setError("Выберите пересдачу");
            return;
        }

        try {
            setRetakeSubmitting(true);
            setError("");

            await assignRetake(selectedRetakeId, retakeStudent.student_id);

            setRetakeOpen(false);
            setRetakeStudent(null);
            setRetakeOptions([]);
            setSelectedRetakeId("");
        } catch (err) {
            setError(err.message || "Не удалось направить на пересдачу");
        } finally {
            setRetakeSubmitting(false);
        }
    }

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
                    onClick={() => navigate("/admin/exams")}
                >
                    ← Назад к списку аттестаций
                </button>
            </div>

            <PageTitle
                title={`Аттестация №${assessment.assessment_id}`}
                subtitle="Просмотр и выставление результатов"
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
                        <span className="exam-info-label">Преподаватель</span>
                        <span className="exam-info-value">{assessment.teacher_name || "—"}</span>
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
                        <span className="exam-info-label">Пересдача</span>
                        <span className="exam-info-value">
              {assessment.is_retake ? "Да" : "Нет"}
            </span>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="card-toolbar">
                    <h2>Результаты студентов</h2>
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

                                    <td className="actions-cell actions-cell--column">
                                        <button
                                            className="primary-button"
                                            onClick={() => handleSave(item.attempt_id)}
                                            disabled={savingId === item.attempt_id}
                                        >
                                            {savingId === item.attempt_id ? "Сохранение..." : "Сохранить"}
                                        </button>

                                        {!assessment.is_retake && item.can_assign_retake && (
                                            <button
                                                className="secondary-button"
                                                onClick={() => openRetakeModal(item)}
                                            >
                                                Направить на пересдачу
                                            </button>
                                        )}

                                        {!assessment.is_retake && item.already_assigned_to_retake && (
                                            <div className="retake-info-box">
                                                Уже направлен на пересдачу
                                                {item.assigned_retake_display ? `: ${item.assigned_retake_display}` : ""}
                                            </div>
                                        )}

                                        {assessment.is_retake && (
                                            <button
                                                className="danger-button"
                                                onClick={() => handleRemoveFromCurrentRetake(item)}
                                                disabled={removingAttemptId === item.attempt_id}
                                            >
                                                {removingAttemptId === item.attempt_id
                                                    ? "Удаление..."
                                                    : "Убрать с пересдачи"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="6">
                                <div className="empty-state">
                                    На этой аттестации нет студентов (
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <Modal
                open={retakeOpen}
                title="Направление на пересдачу"
                onClose={() => {
                    if (!retakeSubmitting) {
                        setRetakeOpen(false);
                        setRetakeStudent(null);
                        setRetakeOptions([]);
                        setSelectedRetakeId("");
                    }
                }}
            >
                <div className="form-grid">
                    <div>
                        <strong>Студент:</strong>{" "}
                        {retakeStudent ? retakeStudent.student_name : "—"}
                    </div>

                    {retakeLoading ? (
                        <div className="empty-state">Загрузка пересдач...</div>
                    ) : (
                        <select
                            className="text-input"
                            value={selectedRetakeId}
                            onChange={(e) => setSelectedRetakeId(e.target.value)}
                        >
                            <option value="">Выберите пересдачу</option>
                            {retakeOptions.map((item) => (
                                <option key={item.assessment_id} value={item.assessment_id}>
                                    {new Date(item.assessment_dt).toLocaleString()} — {item.subject_name}
                                    {item.teacher_name ? ` — ${item.teacher_name}` : ""}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        className="primary-button"
                        onClick={handleAssignRetake}
                        disabled={retakeSubmitting || retakeLoading || !retakeOptions.length}
                    >
                        {retakeSubmitting ? "Направление..." : "Направить"}
                    </button>
                </div>
            </Modal>
        </section>
    );
}