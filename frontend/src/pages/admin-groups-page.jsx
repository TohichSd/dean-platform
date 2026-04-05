import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { Modal } from "../components/common/modal";
import { createGroup, deleteGroup, getGroups } from "../api/groups";

export function AdminGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function loadGroups() {
    try {
      setLoading(true);
      setError("");
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить группы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) =>
      group.group_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [groups, query]);

  async function handleCreateGroup(event) {
    event.preventDefault();

    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      setError("Введите название группы");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const createdGroup = await createGroup({
        group_name: trimmedName,
      });

      setGroups((prev) => [...prev, createdGroup]);
      setNewGroupName("");
      setOpen(false);
    } catch (err) {
      setError(err.message || "Не удалось добавить группу");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGroup(groupId) {
    const confirmed = window.confirm("Удалить группу?");
    if (!confirmed) return;

    try {
      setDeletingId(groupId);
      setError("");

      await deleteGroup(groupId);

      setGroups((prev) => prev.filter((group) => group.group_id !== groupId));
    } catch (err) {
      setError(err.message || "Не удалось удалить группу");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <PageTitle
        title="Группы"
        subtitle="Управление учебными группами"
        actions={
          <button className="primary-button" onClick={() => setOpen(true)}>
            Добавить группу
          </button>
        }
      />

      <div className="filters">
        <input
          className="text-input"
          placeholder="Поиск по названию группы"
          value={query}
          onInput={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка групп...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Наименование группы</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <tr key={group.group_id}>
                    <td>{group.group_id}</td>
                    <td>{group.group_name}</td>
                    <td className="actions-cell">
                      <button
                        className="danger-button"
                        onClick={() => handleDeleteGroup(group.group_id)}
                        disabled={deletingId === group.group_id}
                      >
                        {deletingId === group.group_id ? "Удаление..." : "Удалить"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">Группы не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title="Добавление группы"
        onClose={() => {
          if (!submitting) {
            setOpen(false);
            setNewGroupName("");
          }
        }}
      >
        <form className="form-grid" onSubmit={handleCreateGroup}>
          <input
            className="text-input"
            placeholder="Наименование группы"
            value={newGroupName}
            onInput={(e) => setNewGroupName(e.target.value)}
          />

          <button className="primary-button" disabled={submitting}>
            {submitting ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>
    </section>
  );
}