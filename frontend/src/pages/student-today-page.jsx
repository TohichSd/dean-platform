import { useEffect, useMemo, useState } from "preact/hooks";
import { PageTitle } from "../components/common/page-title";
import { getStudentAssessments } from "../api/student";

function isSameLocalDate(dateString, now) {
  const date = new Date(dateString);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function StudentTodayPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await getStudentAssessments();
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
        title="Экзамены сегодня"
        subtitle="Сегодняшние экзамены, зачёты и пересдачи"
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
                <th>Преподаватель</th>
                <th>Тип</th>
              </tr>
            </thead>
            <tbody>
              {todayAssessments.length > 0 ? (
                todayAssessments.map((item) => (
                  <tr key={item.assessment_id}>
                    <td>
                      {new Date(item.assessment_dt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{item.subject_name || "—"}</td>
                    <td>{item.teacher_name || "—"}</td>
                    <td>
                      <div className="assessment-type-cell">
                        <span className="badge badge--blue">
                          {item.is_exam ? "Экзамен" : "Зачёт"}
                        </span>
                        {item.is_retake && (
                          <span className="badge badge--red">Пересдача</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
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