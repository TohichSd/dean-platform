import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { Modal } from "../components/common/modal";
import { createUser, deleteUser, getUsers, updateUser } from "../api/users";
import { getRoles } from "../api/roles";
import { getGroups } from "../api/groups";
import { getDepartments } from "../api/departments";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  surname: "",
  login: "",
  password: "",
  role_id: "",
  group_id: "",
  department_id: "",
};

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [usersData, rolesData, groupsData, departmentsData] = await Promise.all([
        getUsers(),
        getRoles(),
        getGroups(),
        getDepartments(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setGroups(groupsData);
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

  const createSelectedRole = roles.find(
    (role) => String(role.role_id) === String(createForm.role_id)
  );

  const editSelectedRole = roles.find(
    (role) => String(role.role_id) === String(editForm.role_id)
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName =
        `${user.last_name} ${user.first_name} ${user.surname || ""}`.toLowerCase();

      const matchesQuery =
        fullName.includes(query.toLowerCase()) ||
        user.login.toLowerCase().includes(query.toLowerCase());

      const matchesRole =
        !roleFilter || String(user.role_id) === String(roleFilter);

      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  function resetCreateForm() {
    setCreateForm(EMPTY_FORM);
  }

  function resetEditForm() {
    setEditForm(EMPTY_FORM);
    setEditingUserId(null);
  }

  function openEditModal(user) {
    setError("");
    setEditingUserId(user.user_id);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      surname: user.surname || "",
      login: user.login || "",
      password: "",
      role_id: String(user.role_id ?? ""),
      group_id: user.group_id ? String(user.group_id) : "",
      department_id: user.department_id ? String(user.department_id) : "",
    });
    setEditOpen(true);
  }

  function buildCreatePayload() {
    return {
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim(),
      surname: createForm.surname.trim() || null,
      login: createForm.login.trim(),
      password: createForm.password,
      password_salt: null,
      role_id: Number(createForm.role_id),
      group_id:
        createSelectedRole?.role_name === "student" && createForm.group_id
          ? Number(createForm.group_id)
          : null,
      department_id:
        createSelectedRole?.role_name === "teacher" && createForm.department_id
          ? Number(createForm.department_id)
          : null,
    };
  }

  function buildEditPayload() {
    const payload = {
      first_name: editForm.first_name.trim() || null,
      last_name: editForm.last_name.trim() || null,
      surname: editForm.surname.trim() || null,
      login: editForm.login.trim() || null,
      role_id: editForm.role_id ? Number(editForm.role_id) : null,
      password_salt: null,
      group_id:
        editSelectedRole?.role_name === "student" && editForm.group_id
          ? Number(editForm.group_id)
          : null,
      department_id:
        editSelectedRole?.role_name === "teacher" && editForm.department_id
          ? Number(editForm.department_id)
          : null,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    return payload;
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    if (
      !createForm.first_name.trim() ||
      !createForm.last_name.trim() ||
      !createForm.login.trim() ||
      !createForm.password.trim() ||
      !createForm.role_id
    ) {
      setError("Заполните обязательные поля");
      return;
    }

    if (createSelectedRole?.role_name === "student" && !createForm.group_id) {
      setError("Для студента необходимо выбрать группу");
      return;
    }

    if (createSelectedRole?.role_name === "teacher" && !createForm.department_id) {
      setError("Для преподавателя необходимо выбрать кафедру");
      return;
    }

    try {
      setSubmittingCreate(true);
      setError("");

      const createdUser = await createUser(buildCreatePayload());

      setUsers((prev) => [...prev, createdUser]);
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      setError(err.message || "Не удалось создать пользователя");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleEditUser(event) {
    event.preventDefault();

    if (
      !editForm.first_name.trim() ||
      !editForm.last_name.trim() ||
      !editForm.login.trim() ||
      !editForm.role_id
    ) {
      setError("Заполните обязательные поля");
      return;
    }

    if (editSelectedRole?.role_name === "student" && !editForm.group_id) {
      setError("Для студента необходимо выбрать группу");
      return;
    }

    if (editSelectedRole?.role_name === "teacher" && !editForm.department_id) {
      setError("Для преподавателя необходимо выбрать кафедру");
      return;
    }

    try {
      setSubmittingEdit(true);
      setError("");

      const updatedUser = await updateUser(editingUserId, buildEditPayload());

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === editingUserId ? updatedUser : user
        )
      );

      setEditOpen(false);
      resetEditForm();
    } catch (err) {
      setError(err.message || "Не удалось обновить пользователя");
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function handleDeleteUser(userId) {
    const confirmed = window.confirm("Удалить пользователя?");
    if (!confirmed) return;

    try {
      setDeletingId(userId);
      setError("");

      await deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
    } catch (err) {
      setError(err.message || "Не удалось удалить пользователя");
    } finally {
      setDeletingId(null);
    }
  }

  function renderRoleSpecificFields(form, setForm, selectedRole) {
    return (
      <>
        {selectedRole?.role_name === "student" && (
          <select
            className="text-input"
            value={form.group_id}
            onChange={(e) =>
              setForm({
                ...form,
                group_id: e.target.value,
              })
            }
          >
            <option value="">Выберите группу</option>
            {groups.map((group) => (
              <option key={group.group_id} value={group.group_id}>
                {group.group_name}
              </option>
            ))}
          </select>
        )}

        {selectedRole?.role_name === "teacher" && (
          <select
            className="text-input"
            value={form.department_id}
            onChange={(e) =>
              setForm({
                ...form,
                department_id: e.target.value,
              })
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
        )}
      </>
    );
  }

  return (
    <section>
      <PageTitle
        title="Пользователи"
        subtitle="Управление учётными записями системы"
        actions={
          <button
            className="primary-button"
            onClick={() => {
              setError("");
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            Добавить пользователя
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

        <select
          className="text-input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Все роли</option>
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name_ru}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка пользователей...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Логин</th>
                <th>Роль</th>
                <th>Группа</th>
                <th>Кафедра</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>
                      {user.last_name} {user.first_name} {user.surname || ""}
                    </td>
                    <td>{user.login}</td>
                    <td>{user.role_name_ru || user.role_name}</td>
                    <td>
                      {user.group_id
                        ? groups.find((group) => group.group_id === user.group_id)?.group_name || "—"
                        : "—"}
                    </td>
                    <td>
                      {user.department_id
                        ? departments.find(
                            (department) =>
                              department.department_id === user.department_id
                          )?.department_name || "—"
                        : "—"}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="secondary-button"
                        onClick={() => openEditModal(user)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => handleDeleteUser(user.user_id)}
                        disabled={deletingId === user.user_id}
                      >
                        {deletingId === user.user_id ? "Удаление..." : "Удалить"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">Пользователи не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={createOpen}
        title="Добавление пользователя"
        onClose={() => {
          if (!submittingCreate) {
            setCreateOpen(false);
            resetCreateForm();
          }
        }}
      >
        <form className="form-grid" onSubmit={handleCreateUser}>
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
            value={createForm.role_id}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                role_id: e.target.value,
                group_id: "",
                department_id: "",
              })
            }
          >
            <option value="">Выберите роль</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name_ru}
              </option>
            ))}
          </select>

          {renderRoleSpecificFields(createForm, setCreateForm, createSelectedRole)}

          <button className="primary-button" disabled={submittingCreate}>
            {submittingCreate ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Редактирование пользователя"
        onClose={() => {
          if (!submittingEdit) {
            setEditOpen(false);
            resetEditForm();
          }
        }}
      >
        <form className="form-grid" onSubmit={handleEditUser}>
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
            value={editForm.role_id}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                role_id: e.target.value,
                group_id: "",
                department_id: "",
              })
            }
          >
            <option value="">Выберите роль</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name_ru}
              </option>
            ))}
          </select>

          {renderRoleSpecificFields(editForm, setEditForm, editSelectedRole)}

          <button className="primary-button" disabled={submittingEdit}>
            {submittingEdit ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>
    </section>
  );
}