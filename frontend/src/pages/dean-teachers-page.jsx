import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { Modal } from "../components/common/modal";
import {
  createDeanTeacher,
  getDeanTeachers,
  updateDeanTeacher,
} from "../api/dean-teachers";
import { getRoles } from "../api/roles";
import { getDepartments } from "../api/departments";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  surname: "",
  login: "",
  password: "",
  role_id: "",
  department_id: "",
};

export function DeanTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

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

      const [usersData, rolesData, departmentsData] = await Promise.all([
        getDeanTeachers(),
        getRoles(),
        getDepartments(),
      ]);

      setTeachers(usersData.filter((item) => item.role_name === "teacher"));
      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const teacherRole = roles.find((role) => role.role_name === "teacher");

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const fullName =
        `${teacher.last_name} ${teacher.first_name} ${teacher.surname || ""}`.toLowerCase();

      return (
        fullName.includes(query.toLowerCase()) ||
        teacher.login.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [teachers, query]);

  function resetCreateForm() {
    setCreateForm(EMPTY_FORM);
  }

  function resetEditForm() {
    setEditForm(EMPTY_FORM);
    setEditingUserId(null);
  }

  function openEditModal(teacher) {
    setError("");
    setEditingUserId(teacher.user_id);
    setEditForm({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      surname: teacher.surname || "",
      login: teacher.login || "",
      password: "",
      role_id: String(teacher.role_id || ""),
      department_id: teacher.department_id ? String(teacher.department_id) : "",
    });
    setEditOpen(true);
  }

  async function handleCreateTeacher(event) {
    event.preventDefault();

    if (
      !createForm.first_name.trim() ||
      !createForm.last_name.trim() ||
      !createForm.login.trim() ||
      !createForm.password.trim() ||
      !createForm.department_id
    ) {
      setError("Заполните обязательные поля");
      return;
    }

    try {
      setSubmittingCreate(true);
      setError("");

      const created = await createDeanTeacher({
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        surname: createForm.surname.trim() || null,
        login: createForm.login.trim(),
        password: createForm.password,
        password_salt: null,
        role_id: teacherRole.role_id,
        group_id: null,
        department_id: Number(createForm.department_id),
      });

      setTeachers((prev) => [...prev, created]);
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      setError(err.message || "Не удалось создать преподавателя");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleEditTeacher(event) {
    event.preventDefault();

    if (
      !editForm.first_name.trim() ||
      !editForm.last_name.trim() ||
      !editForm.login.trim() ||
      !editForm.department_id
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
        role_id: teacherRole.role_id,
        group_id: null,
        department_id: Number(editForm.department_id),
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
        payload.password_salt = null;
      }

      const updated = await updateDeanTeacher(editingUserId, payload);

      setTeachers((prev) =>
        prev.map((item) => (item.user_id === editingUserId ? updated : item))
      );

      setEditOpen(false);
      resetEditForm();
    } catch (err) {
      setError(err.message || "Не удалось обновить преподавателя");
    } finally {
      setSubmittingEdit(false);
    }
  }

  return (
    <section>
      <PageTitle
        title="Преподаватели"
        subtitle="Управление преподавателями"
        actions={
          <button
            className="primary-button"
            onClick={() => {
              setError("");
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            Добавить преподавателя
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
          <div className="empty-state">Загрузка преподавателей...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Логин</th>
                <th>Кафедра</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.user_id}>
                    <td>{teacher.user_id}</td>
                    <td>
                      {teacher.last_name} {teacher.first_name} {teacher.surname || ""}
                    </td>
                    <td>{teacher.login}</td>
                    <td>
                      {departments.find((d) => d.department_id === teacher.department_id)
                        ?.department_name || "—"}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="secondary-button"
                        onClick={() => openEditModal(teacher)}
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">Преподаватели не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={createOpen}
        title="Добавление преподавателя"
        onClose={() => {
          if (!submittingCreate) {
            setCreateOpen(false);
            resetCreateForm();
          }
        }}
      >
        <form className="form-grid" onSubmit={handleCreateTeacher}>
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
            value={createForm.department_id}
            onChange={(e) =>
              setCreateForm({ ...createForm, department_id: e.target.value })
            }
          >
            <option value="">Выберите кафедру</option>
            {departments.map((department) => (
              <option
                key={department.department_id}
                value={department.department_id}
              >
                {department.department_name}
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
        title="Редактирование преподавателя"
        onClose={() => {
          if (!submittingEdit) {
            setEditOpen(false);
            resetEditForm();
          }
        }}
      >
        <form className="form-grid" onSubmit={handleEditTeacher}>
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
            value={editForm.department_id}
            onChange={(e) =>
              setEditForm({ ...editForm, department_id: e.target.value })
            }
          >
            <option value="">Выберите кафедру</option>
            {departments.map((department) => (
              <option
                key={department.department_id}
                value={department.department_id}
              >
                {department.department_name}
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