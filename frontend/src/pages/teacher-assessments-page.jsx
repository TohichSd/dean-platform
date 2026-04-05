import { useEffect, useMemo, useState } from "preact/hooks";
import { Link } from "wouter-preact";
import { PageTitle } from "../components/common/page-title";
import { getAssessments } from "../api/assessments";

export function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getAssessments();
      setAssessments(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить аттестации");
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
      const groupName = (assessment.group_name || "").toLowerCase();

      return (
        subjectName.includes(query.toLowerCase()) ||
        groupName.includes(query.toLowerCase())
      );
    });
  }, [assessments, query]);

  return (
    <section>
      <PageTitle
        title="Мои аттестации"
        subtitle="Экзамены, зачёты и пересдачи, которые вы проводите"
      />

      <div className="filters">
        <input
          className="text-input"
          placeholder="Поиск по предмету или группе"
          value={query}
          onInput={(e) => setQuery(e.target.value)}
        />
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
                <th>Предмет</th>
                <th>Группа</th>
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
                        href={`/teacher/assessments/${assessment.assessment_id}`}
                        className="table-link"
                      >
                        {assessment.subject_name || "—"}
                      </Link>
                    </td>
                    <td>{assessment.group_name || "—"}</td>
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
                    <td>
                      <Link
                        href={`/teacher/assessments/${assessment.assessment_id}`}
                        className="secondary-button"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">Аттестации не найдены</div>
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