import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { Modal } from "../components/common/modal";
import {
  createSubject,
  deleteSubject,
  getSubjects,
} from "../api/subjects";

export function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function loadSubjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить предметы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      subject.subject_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [subjects, query]);

  async function handleCreateSubject(event) {
    event.preventDefault();

    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      setError("Введите название предмета");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const createdSubject = await createSubject({
        subject_name: trimmedName,
      });

      setSubjects((prev) => [...prev, createdSubject]);
      setNewSubjectName("");
      setOpen(false);
    } catch (err) {
      setError(err.message || "Не удалось добавить предмет");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSubject(subjectId) {
    const confirmed = window.confirm("Удалить предмет?");
    if (!confirmed) return;

    try {
      setDeletingId(subjectId);
      setError("");

      await deleteSubject(subjectId);

      setSubjects((prev) =>
        prev.filter((subject) => subject.subject_id !== subjectId)
      );
    } catch (err) {
      setError(err.message || "Не удалось удалить предмет");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <PageTitle
        title="Предметы"
        subtitle="Управление учебными дисциплинами"
        actions={
          <button className="primary-button" onClick={() => setOpen(true)}>
            Добавить предмет
          </button>
        }
      />

      <div className="filters">
        <input
          className="text-input"
          placeholder="Поиск по названию предмета"
          value={query}
          onInput={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка предметов...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Наименование предмета</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <tr key={subject.subject_id}>
                    <td>{subject.subject_id}</td>
                    <td>{subject.subject_name}</td>
                    <td className="actions-cell">
                      <button
                        className="danger-button"
                        onClick={() => handleDeleteSubject(subject.subject_id)}
                        disabled={deletingId === subject.subject_id}
                      >
                        {deletingId === subject.subject_id
                          ? "Удаление..."
                          : "Удалить"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">Предметы не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title="Добавление предмета"
        onClose={() => {
          if (!submitting) {
            setOpen(false);
            setNewSubjectName("");
          }
        }}
      >
        <form className="form-grid" onSubmit={handleCreateSubject}>
          <input
            className="text-input"
            placeholder="Наименование предмета"
            value={newSubjectName}
            onInput={(e) => setNewSubjectName(e.target.value)}
          />

          <button className="primary-button" disabled={submitting}>
            {submitting ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>
    </section>
  );
}