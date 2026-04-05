import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { Modal } from "../components/common/modal";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
} from "../api/departments";

export function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [newDepartmentName, setNewDepartmentName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить кафедры");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) =>
      department.department_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [departments, query]);

  async function handleCreateDepartment(event) {
    event.preventDefault();

    const trimmedName = newDepartmentName.trim();
    if (!trimmedName) {
      setError("Введите название кафедры");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const createdDepartment = await createDepartment({
        department_name: trimmedName,
      });

      setDepartments((prev) => [...prev, createdDepartment]);
      setNewDepartmentName("");
      setOpen(false);
    } catch (err) {
      setError(err.message || "Не удалось добавить кафедру");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDepartment(departmentId) {
    const confirmed = window.confirm("Удалить кафедру?");
    if (!confirmed) return;

    try {
      setDeletingId(departmentId);
      setError("");

      await deleteDepartment(departmentId);

      setDepartments((prev) =>
        prev.filter(
          (department) => department.department_id !== departmentId
        )
      );
    } catch (err) {
      setError(err.message || "Не удалось удалить кафедру");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <PageTitle
        title="Кафедры"
        subtitle="Управление кафедрами"
        actions={
          <button className="primary-button" onClick={() => setOpen(true)}>
            Добавить кафедру
          </button>
        }
      />

      <div className="filters">
        <input
          className="text-input"
          placeholder="Поиск по названию кафедры"
          value={query}
          onInput={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка кафедр...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Наименование кафедры</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((department) => (
                  <tr key={department.department_id}>
                    <td>{department.department_id}</td>
                    <td>{department.department_name}</td>
                    <td className="actions-cell">
                      <button
                        className="danger-button"
                        onClick={() =>
                          handleDeleteDepartment(department.department_id)
                        }
                        disabled={deletingId === department.department_id}
                      >
                        {deletingId === department.department_id
                          ? "Удаление..."
                          : "Удалить"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">Кафедры не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title="Добавление кафедры"
        onClose={() => {
          if (!submitting) {
            setOpen(false);
            setNewDepartmentName("");
          }
        }}
      >
        <form className="form-grid" onSubmit={handleCreateDepartment}>
          <input
            className="text-input"
            placeholder="Наименование кафедры"
            value={newDepartmentName}
            onInput={(e) => setNewDepartmentName(e.target.value)}
          />

          <button className="primary-button" disabled={submitting}>
            {submitting ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>
    </section>
  );
}