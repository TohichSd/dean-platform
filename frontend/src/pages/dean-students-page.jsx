import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { Modal } from "../components/common/modal";
import {
  createDeanStudent,
  getDeanStudents,
  updateDeanStudent,
} from "../api/dean-students";
import { getRoles } from "../api/roles";
import { getGroups } from "../api/groups";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  surname: "",
  login: "",
  password: "",
  role_id: "",
  group_id: "",
};

export function DeanStudentsPage() {
  const [students, setStudents] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);

  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [usersData, rolesData, groupsData] = await Promise.all([
        getDeanStudents(),
        getRoles(),
        getGroups(),
      ]);

      setStudents(usersData.filter((item) => item.role_name === "student"));
      setRoles(rolesData);
      setGroups(groupsData);
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const studentRole = roles.find((role) => role.role_name === "student");

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName =
        `${student.last_name} ${student.first_name} ${student.surname || ""}`.toLowerCase();

      return (
        fullName.includes(query.toLowerCase()) ||
        student.login.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [students, query]);

  function resetCreateForm() {
    setCreateForm(EMPTY_FORM);
  }

  function resetEditForm() {
    setEditForm(EMPTY_FORM);
    setEditingUserId(null);
  }

  function openEditModal(student) {
    setError("");
    setEditingUserId(student.user_id);
    setEditForm({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      surname: student.surname || "",
      login: student.login || "",
      password: "",
      role_id: String(student.role_id || ""),
      group_id: student.group_id ? String(student.group_id) : "",
    });
    setEditOpen(true);
  }

  async function handleCreateStudent(event) {
    event.preventDefault();

    if (
      !createForm.first_name.trim() ||
      !createForm.last_name.trim() ||
      !createForm.login.trim() ||
      !createForm.password.trim() ||
      !createForm.group_id
    ) {
      setError("Заполните обязательные поля");
      return;
    }

    try {
      setSubmittingCreate(true);
      setError("");

      const created = await createDeanStudent({
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        surname: createForm.surname.trim() || null,
        login: createForm.login.trim(),
        password: createForm.password,
        password_salt: null,
        role_id: studentRole.role_id,
        group_id: Number(createForm.group_id),
        department_id: null,
      });

      setStudents((prev) => [...prev, created]);
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      setError(err.message || "Не удалось создать студента");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleEditStudent(event) {
    event.preventDefault();

    if (
      !editForm.first_name.trim() ||
      !editForm.last_name.trim() ||
      !editForm.login.trim() ||
      !editForm.group_id
    ) {
      setError("Заполните обязательные поля");
      return;
    }

    try {
      setSubmittingEdit(true);
      setError("");

      const payload = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        surname: editForm.surname.trim() || null,
        login: editForm.login.trim(),
        role_id: studentRole.role_id,
        group_id: Number(editForm.group_id),
        department_id: null,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
        payload.password_salt = null;
      }

      const updated = await updateDeanStudent(editingUserId, payload);

      setStudents((prev) =>
        prev.map((item) => (item.user_id === editingUserId ? updated : item))
      );

      setEditOpen(false);
      resetEditForm();
    } catch (err) {
      setError(err.message || "Не удалось обновить студента");
    } finally {
      setSubmittingEdit(false);
    }
  }

  return (
    <section>
      <PageTitle
        title="Студенты"
        subtitle="Управление студентами"
        actions={
          <button
            className="primary-button"
            onClick={() => {
              setError("");
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            Добавить студента
          </button>
        }
      />

      <div className="filters">
        <input
          className="text-input"
          placeholder="Поиск по ФИО или логину"
          value={query}
          onInput={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка студентов...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Логин</th>
                <th>Группа</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.user_id}>
                    <td>{student.user_id}</td>
                    <td>
                      {student.last_name} {student.first_name} {student.surname || ""}
                    </td>
                    <td>{student.login}</td>
                    <td>
                      {groups.find((g) => g.group_id === student.group_id)?.group_name || "—"}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="secondary-button"
                        onClick={() => openEditModal(student)}
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">Студенты не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={createOpen}
        title="Добавление студента"
        onClose={() => {
          if (!submittingCreate) {
            setCreateOpen(false);
            resetCreateForm();
          }
        }}
      >
        <form className="form-grid" onSubmit={handleCreateStudent}>
          <input
            className="text-input"
            placeholder="Имя"
            value={createForm.first_name}
            onInput={(e) =>
              setCreateForm({ ...createForm, first_name: e.target.value })
            }
          />
          <input
            className="text-input"
            placeholder="Фамилия"
            value={createForm.last_name}
            onInput={(e) =>
              setCreateForm({ ...createForm, last_name: e.target.value })
            }
          />
          <input
            className="text-input"
            placeholder="Отчество"
            value={createForm.surname}
            onInput={(e) =>
              setCreateForm({ ...createForm, surname: e.target.value })
            }
          />
          <input
            className="text-input"
            placeholder="Логин"
            value={createForm.login}
            onInput={(e) =>
              setCreateForm({ ...createForm, login: e.target.value })
            }
          />
          <input
            className="text-input"
            type="password"
            placeholder="Пароль"
            value={createForm.password}
            onInput={(e) =>
              setCreateForm({ ...createForm, password: e.target.value })
            }
          />
          <select
            className="text-input"
            value={createForm.group_id}
            onChange={(e) =>
              setCreateForm({ ...createForm, group_id: e.target.value })
            }
          >
            <option value="">Выберите группу</option>
            {groups.map((group) => (
              <option key={group.group_id} value={group.group_id}>
                {group.group_name}
              </option>
            ))}
          </select>

          <button className="primary-button" disabled={submittingCreate}>
            {submittingCreate ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Редактирование студента"
        onClose={() => {
          if (!submittingEdit) {
            setEditOpen(false);
            resetEditForm();
          }
        }}
      >
        <form className="form-grid" onSubmit={handleEditStudent}>
          <input
            className="text-input"
            placeholder="Имя"
            value={editForm.first_name}
            onInput={(e) =>
              setEditForm({ ...editForm, first_name: e.target.value })
            }
          />
          <input
            className="text-input"
            placeholder="Фамилия"
            value={editForm.last_name}
            onInput={(e) =>
              setEditForm({ ...editForm, last_name: e.target.value })
            }
          />
          <input
            className="text-input"
            placeholder="Отчество"
            value={editForm.surname}
            onInput={(e) =>
              setEditForm({ ...editForm, surname: e.target.value })
            }
          />
          <input
            className="text-input"
            placeholder="Логин"
            value={editForm.login}
            onInput={(e) =>
              setEditForm({ ...editForm, login: e.target.value })
            }
          />
          <input
            className="text-input"
            type="password"
            placeholder="Новый пароль (необязательно)"
            value={editForm.password}
            onInput={(e) =>
              setEditForm({ ...editForm, password: e.target.value })
            }
          />
          <select
            className="text-input"
            value={editForm.group_id}
            onChange={(e) =>
              setEditForm({ ...editForm, group_id: e.target.value })
            }
          >
            <option value="">Выберите группу</option>
            {groups.map((group) => (
              <option key={group.group_id} value={group.group_id}>
                {group.group_name}
              </option>
            ))}
          </select>

          <button className="primary-button" disabled={submittingEdit}>
            {submittingEdit ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>
    </section>
  );
}