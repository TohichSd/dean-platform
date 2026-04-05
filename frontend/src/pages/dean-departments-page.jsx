import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { getDepartments } from "../api/departments";

export function DeanDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
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

  return (
    <section>
      <PageTitle
        title="Кафедры"
        subtitle="Просмотр кафедр"
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
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((department) => (
                  <tr key={department.department_id}>
                    <td>{department.department_id}</td>
                    <td>{department.department_name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">
                    <div className="empty-state">Кафедры не найдены</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}