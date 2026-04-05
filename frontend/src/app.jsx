import {Redirect, Route, Switch} from "wouter-preact";

import {AppLayout} from "./components/layout/app-layout";
import {DeanLayout} from "./components/layout/dean-layout";
import {TeacherLayout} from "./components/layout/teacher-layout";
import {StudentLayout} from "./components/layout/student-layout";
import {ProtectedRoute} from "./components/auth/protected-route";

import {LoginPage} from "./pages/login-page";

import {AdminUsersPage} from "./pages/admin-users-page";
import {AdminDepartmentsPage} from "./pages/admin-departments-page";
import {AdminGroupsPage} from "./pages/admin-groups-page";
import {AdminSubjectsPage} from "./pages/admin-subjects-page";
import {AdminExamsPage} from "./pages/admin-exams-page";
import {ExamDetailsPage} from "./pages/exam-details-page";

import {DeanStudentsPage} from "./pages/dean-students-page";
import {DeanTeachersPage} from "./pages/dean-teachers-page";
import {DeanGroupsPage} from "./pages/dean-groups-page";
import {DeanDepartmentsPage} from "./pages/dean-departments-page";
import {DeanExamsPage} from "./pages/dean-exams-page";
import {DeanExamDetailsPage} from "./pages/dean-exam-details-page.jsx";

import {TeacherAssessmentsPage} from "./pages/teacher-assessments-page";
import {TeacherAssessmentDetailsPage} from "./pages/teacher-assessment-details-page.jsx";
import {TeacherTodayPage} from "./pages/teacher-today-page.jsx";

import {StudentTodayPage} from "./pages/student-today-page";
import {StudentAssessmentsPage} from "./pages/student-assessments-page";
import {StudentStatisticsPage} from "./pages/student-statistics-page";
import { AdminGroupStatisticsPage } from "./pages/admin-group-statistics-page";
import { DeanGroupStatisticsPage } from "./pages/dean-group-statistics-page";

export function App() {
    return (
        <Switch>
            <Route path="/login" component={LoginPage}/>

            <Route path="/dean/exams/:id" component={DeanExamDetailsPage}/>
            <Route path="/admin/exams/:id" component={ExamDetailsPage}/>
            <Route
                path="/teacher/assessments/:id"
                component={TeacherAssessmentDetailsPage}
            />
            <Route path="/admin/:rest*">
                <ProtectedRoute allowedRoles={["admin"]}>
                    <AppLayout>
                        <Switch>
                            <Route path="/admin/group-statistics" component={AdminGroupStatisticsPage} />
                            <Route path="/admin/users" component={AdminUsersPage}/>
                            <Route path="/admin/departments" component={AdminDepartmentsPage}/>
                            <Route path="/admin/groups" component={AdminGroupsPage}/>
                            <Route path="/admin/subjects" component={AdminSubjectsPage}/>
                            <Route path="/admin/exams" component={AdminExamsPage}/>
                            <Route>
                                <Redirect to="/admin/users"/>
                            </Route>
                        </Switch>
                    </AppLayout>
                </ProtectedRoute>
            </Route>

            <Route path="/dean/:rest*">
                <ProtectedRoute allowedRoles={["admin", "dean"]}>
                    <DeanLayout>
                        <Switch>
                            <Route path="/dean/group-statistics" component={DeanGroupStatisticsPage} />
                            <Route path="/dean/students" component={DeanStudentsPage}/>
                            <Route path="/dean/teachers" component={DeanTeachersPage}/>
                            <Route path="/dean/groups" component={DeanGroupsPage}/>
                            <Route path="/dean/departments" component={DeanDepartmentsPage}/>
                            <Route path="/dean/exams" component={DeanExamsPage}/>
                            <Route>
                                <Redirect to="/dean/students"/>
                            </Route>
                        </Switch>
                    </DeanLayout>
                </ProtectedRoute>
            </Route>

            <Route path="/teacher/:rest*">
                <ProtectedRoute allowedRoles={["teacher"]}>
                    <TeacherLayout>
                        <Switch>
                            <Route path="/teacher/today" component={TeacherTodayPage}/>
                            <Route path="/teacher/assessments" component={TeacherAssessmentsPage}/>
                            <Route>
                                <Redirect to="/teacher/today"/>
                            </Route>
                        </Switch>
                    </TeacherLayout>
                </ProtectedRoute>
            </Route>

            <Route path="/student/:rest*">
                <ProtectedRoute allowedRoles={["student"]}>
                    <StudentLayout>
                        <Switch>
                            <Route path="/student/today" component={StudentTodayPage}/>
                            <Route path="/student/assessments" component={StudentAssessmentsPage}/>
                            <Route path="/student/statistics" component={StudentStatisticsPage}/>
                            <Route>
                                <Redirect to="/student/today"/>
                            </Route>
                        </Switch>
                    </StudentLayout>
                </ProtectedRoute>
            </Route>

            <Route path="/">
                <Redirect to="/login"/>
            </Route>
        </Switch>
    );
}