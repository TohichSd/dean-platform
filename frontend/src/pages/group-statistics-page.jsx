import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { getGroupStatistics } from "../api/statistics";

export function GroupStatisticsPage({ title = "Статистика по группам" }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getGroupStatistics();
      setRows(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить статистику");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const matchesQuery = item.group_name
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesType =
        !typeFilter ||
        (typeFilter === "exam" && item.is_exam) ||
        (typeFilter === "credit" && !item.is_exam);

      return matchesQuery && matchesType;
    });
  }, [rows, query, typeFilter]);

  return (
    <section>
      <PageTitle
        title={title}
        subtitle="Итоговые значения по группам"
      />

      <div className="filters">
        <input
          className="text-input"
          placeholder="Поиск по группе"
          value={query}
          onInput={(e) => setQuery(e.target.value)}
        />

        <select
          className="text-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Все типы</option>
          <option value="exam">Экзамены</option>
          <option value="credit">Зачёты</option>
        </select>
      </div>

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка статистики...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Группа</th>
                <th>Тип</th>
                <th>5</th>
                <th>4</th>
                <th>3</th>
                <th>2</th>
                <th>Неявки</th>
                <th>Оценок</th>
                <th>Средний балл</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((item, index) => (
                  <tr key={`${item.group_id}-${item.is_exam}-${index}`}>
                    <td>{item.group_name}</td>
                    <td>
                      <span className="badge badge--blue">
                        {item.assessment_type_name}
                      </span>
                    </td>
                    <td>{item.count_5}</td>
                    <td>{item.count_4}</td>
                    <td>{item.count_3}</td>
                    <td>{item.count_2}</td>
                    <td>{item.absent_count}</td>
                    <td>{item.graded_count}</td>
                    <td>{item.average_score ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">Статистика не найдена</div>
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