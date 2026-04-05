import {useEffect, useMemo, useState} from "preact/hooks";
import {PageTitle} from "../components/common/page-title";
import {getStudentStatistics} from "../api/student";

export function StudentStatisticsPage() {
    const [stats, setStats] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setLoading(true);
            setError("");
            const data = await getStudentStatistics();
            setStats(data);
        } catch (err) {
            setError(err.message || "Не удалось загрузить статистику");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredStats = useMemo(() => {
        return stats.filter((item) =>
            item.subject_name.toLowerCase().includes(query.toLowerCase())
        );
    }, [stats, query]);

    return (
        <section>
            <PageTitle
                title="Моя статистика"
                subtitle="Статистика по предметам"
            />

            <div className="filters">
                <input
                    className="text-input"
                    placeholder="Поиск по предмету"
                    value={query}
                    onInput={(e) => setQuery(e.target.value)}
                />
            </div>

            {error && <div className="error-box page-error-box">{error}</div>}

            <div className="table-card">
                {loading ? (
                    <div className="empty-state">Загрузка статистики...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>Предмет</th>
                            <th>Тип</th>
                            <th>Всего попыток</th>
                            <th>Сдано</th>
                            <th>Не сдано</th>
                            <th>Неявок</th>
                            <th>Средний балл</th>
                            <th>Последний результат</th>
                            <th>Текущий статус</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredStats.length > 0 ? (
                            filteredStats.map((item, index) => (
                                <tr key={`${item.subject_id}-${item.is_exam}-${index}`}>
                                    <td>{item.subject_name}</td>
                                    <td>
            <span className="badge badge--blue">
              {item.assessment_type_name}
            </span>
                                    </td>
                                    <td>{item.attempts_total}</td>
                                    <td>{item.passed_count}</td>
                                    <td>{item.failed_count}</td>
                                    <td>{item.absent_count}</td>
                                    <td>{item.is_exam ? (item.exam_average ?? "—") : "—"}</td>
                                    <td>{item.last_display_value}</td>
                                    <td>
            <span
                className={
                    item.is_currently_passed
                        ? "badge badge--green"
                        : "badge badge--red"
                }
            >
              {item.is_currently_passed ? "Сдано" : "Не сдано"}
            </span>
                                    </td>
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