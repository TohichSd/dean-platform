import { useEffect, useMemo, useState } from "preact/hooks";
import { Link } from "wouter-preact";
import { PageTitle } from "../components/common/page-title";
import { getAssessments } from "../api/assessments";

function isSameLocalDate(dateString, now) {
  const date = new Date(dateString);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function TeacherTodayPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getAssessments();
      setAssessments(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить расписание");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const todayAssessments = useMemo(() => {
    const now = new Date();

    return assessments
      .filter((item) => isSameLocalDate(item.assessment_dt, now))
      .sort(
        (a, b) =>
          new Date(a.assessment_dt).getTime() -
          new Date(b.assessment_dt).getTime()
      );
  }, [assessments]);

  return (
    <section>
      <PageTitle
        title="Расписание на сегодня"
        subtitle="Сегодняшние экзамены и зачёты"
      />

      {error && <div className="error-box page-error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="empty-state">Загрузка расписания...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Предмет</th>
                <th>Группа</th>
                <th>Тип</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {todayAssessments.length > 0 ? (
                todayAssessments.map((assessment) => (
                  <tr key={assessment.assessment_id}>
                    <td>
                      {new Date(assessment.assessment_dt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/teacher/assessments/${assessment.assessment_id}`}
                        className="table-link"
                      >
                        {assessment.subject_name || "—"}
                      </Link>
                    </td>
                    <td>{assessment.group_name || "—"}</td>
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
                  <td colSpan="5">
                    <div className="empty-state">
                      На сегодня аттестаций нет
                    </div>
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