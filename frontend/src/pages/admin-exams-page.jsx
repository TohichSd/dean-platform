import {useEffect, useMemo, useState} from "preact/hooks";
import {Link} from "wouter-preact";
import {PageTitle} from "../components/common/page-title";
import {Modal} from "../components/common/modal";
import {createAssessment, deleteAssessment, getAssessments,} from "../api/assessments";
import {getGroups} from "../api/groups";
import {getSubjects} from "../api/subjects";
import {getTeachers} from "../api/teachers";

const EMPTY_FORM = {
    group_id: "",
    is_exam: "true",
    teacher_id: "",
    assessment_dt: "",
    is_retake: "false",
    subject_id: "",
};

export function AdminExamsPage() {
    const [assessments, setAssessments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [query, setQuery] = useState("");
    const [groupFilter, setGroupFilter] = useState("");
    const [open, setOpen] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [assessmentsData, groupsData, subjectsData, teachersData] =
                await Promise.all([
                    getAssessments(),
                    getGroups(),
                    getSubjects(),
                    getTeachers(),
                ]);

            setAssessments(assessmentsData);
            setGroups(groupsData);
            setSubjects(subjectsData);
            setTeachers(teachersData);
        } catch (err) {
            setError(err.message || "Не удалось загрузить данные");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredAssessments = useMemo(() => {
        return assessments.filter((assessment) => {
            const subjectName = (assessment.subject_name || "").toLowerCase();
            const teacherName = (assessment.teacher_name || "").toLowerCase();

            const matchesQuery =
                subjectName.includes(query.toLowerCase()) ||
                teacherName.includes(query.toLowerCase());

            const matchesGroup =
                !groupFilter || String(assessment.group_id) === String(groupFilter);

            return matchesQuery && matchesGroup;
        });
    }, [assessments, query, groupFilter]);

    function resetForm() {
        setForm(EMPTY_FORM);
    }

    async function handleCreateAssessment(event) {
        event.preventDefault();

        if (
            !form.group_id ||
            !form.teacher_id ||
            !form.subject_id ||
            !form.assessment_dt
        ) {
            setError("Заполните обязательные поля");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const created = await createAssessment({
                group_id: Number(form.group_id),
                is_exam: form.is_exam === "true",
                teacher_id: Number(form.teacher_id),
                assessment_dt: form.assessment_dt,
                is_retake: form.is_retake === "true",
                subject_id: Number(form.subject_id),
            });

            setAssessments((prev) => [...prev, created]);
            setOpen(false);
            resetForm();
        } catch (err) {
            setError(err.message || "Не удалось создать аттестацию");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteAssessment(assessmentId) {
        const confirmed = window.confirm("Удалить аттестацию?");
        if (!confirmed) return;

        try {
            setDeletingId(assessmentId);
            setError("");

            await deleteAssessment(assessmentId);
            setAssessments((prev) =>
                prev.filter((item) => item.assessment_id !== assessmentId)
            );
        } catch (err) {
            setError(err.message || "Не удалось удалить аттестацию");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <section>
            <PageTitle
                title="Экзамены и зачёты"
                subtitle="Управление аттестациями"
                actions={
                    <button className="primary-button" onClick={() => setOpen(true)}>
                        Добавить аттестацию
                    </button>
                }
            />

            <div className="filters">
                <input
                    className="text-input"
                    placeholder="Поиск по дисциплине или преподавателю"
                    value={query}
                    onInput={(e) => setQuery(e.target.value)}
                />

                <select
                    className="text-input"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                >
                    <option value="">Все группы</option>
                    {groups.map((group) => (
                        <option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                        </option>
                    ))}
                </select>
            </div>

            {error && <div className="error-box page-error-box">{error}</div>}

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">Загрузка аттестаций...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Дисциплина</th>
                            <th>Группа</th>
                            <th>Преподаватель</th>
                            <th>Дата</th>
                            <th>Тип</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredAssessments.length > 0 ? (
                            filteredAssessments.map((assessment) => (
                                <tr key={assessment.assessment_id}>
                                    <td>{assessment.assessment_id}</td>
                                    <td>
                                        <Link
                                            href={`/admin/exams/${assessment.assessment_id}`}
                                            className="table-link"
                                        >
                                            {assessment.subject_name || "—"}
                                        </Link>
                                    </td>
                                    <td>{assessment.group_name || "—"}</td>
                                    <td>{assessment.teacher_name || "—"}</td>
                                    <td>{new Date(assessment.assessment_dt).toLocaleString()}</td>
                                    <td>
                                        <div className="assessment-type-cell">
    <span className="badge badge--blue">
      {assessment.is_exam ? "Экзамен" : "Зачёт"}
    </span>

                                            {assessment.is_retake && (
                                                <span className="badge badge--red">Пересдача</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="danger-button"
                                            onClick={() => handleDeleteAssessment(assessment.assessment_id)}
                                            disabled={deletingId === assessment.assessment_id}
                                        >
                                            {deletingId === assessment.assessment_id
                                                ? "Удаление..."
                                                : "Удалить"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">
                                    <div className="empty-state">Аттестации не найдены</div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                open={open}
                title="Добавление аттестации"
                onClose={() => {
                    if (!submitting) {
                        setOpen(false);
                        resetForm();
                    }
                }}
            >
                <form className="form-grid" onSubmit={handleCreateAssessment}>
                    <select
                        className="text-input"
                        value={form.group_id}
                        onChange={(e) => setForm({...form, group_id: e.target.value})}
                    >
                        <option value="">Выберите группу</option>
                        {groups.map((group) => (
                            <option key={group.group_id} value={group.group_id}>
                                {group.group_name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="text-input"
                        value={form.teacher_id}
                        onChange={(e) => setForm({...form, teacher_id: e.target.value})}
                    >
                        <option value="">Выберите преподавателя</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.teacher_id} value={teacher.teacher_id}>
                                {teacher.full_name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="text-input"
                        value={form.subject_id}
                        onChange={(e) => setForm({...form, subject_id: e.target.value})}
                    >
                        <option value="">Выберите предмет</option>
                        {subjects.map((subject) => (
                            <option key={subject.subject_id} value={subject.subject_id}>
                                {subject.subject_name}
                            </option>
                        ))}
                    </select>

                    <input
                        className="text-input"
                        type="datetime-local"
                        value={form.assessment_dt}
                        onInput={(e) => setForm({...form, assessment_dt: e.target.value})}
                    />

                    <select
                        className="text-input"
                        value={form.is_exam}
                        onChange={(e) => setForm({...form, is_exam: e.target.value})}
                    >
                        <option value="true">Экзамен</option>
                        <option value="false">Зачёт</option>
                    </select>

                    <div className="form-field">
                        <label className="checkbox-field">
                            <input
                                type="checkbox"
                                checked={form.is_retake === "true"}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        is_retake: e.target.checked ? "true" : "false",
                                    })
                                }
                            />
                            <span>Это пересдача</span>
                        </label>

                        <div className="form-hint">
                            Отметьте этот пункт, если создаваемая аттестация является пересдачей.
                        </div>
                    </div>

                    <button className="primary-button" disabled={submitting}>
                        {submitting ? "Сохранение..." : "Сохранить"}
                    </button>
                </form>
            </Modal>
        </section>
    );
}