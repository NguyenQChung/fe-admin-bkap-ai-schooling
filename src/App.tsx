import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import School from "./pages/Tables/Schools";
import Class from "./pages/Tables/Classes";
import Teacher from "./pages/Tables/Teachers";
import FormElements from "./pages/Forms/FormElements";
import NewTeacher from "./pages/Forms/NewTeacher";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Student from "./pages/Tables/Students";
import DefaultReply from "./pages/Tables/DefaultReply";
import ForbiddenKeyword from "./pages/Tables/Forbiddenkeyword";
import AddSchool from "./pages/Forms/AddSchool";
import "react-toastify/dist/ReactToastify.css";
import AddClass from "./pages/Forms/AddClass";
import AddDefaultReply from "./pages/Forms/AddDefaultReply";
import AddForbiddenkeyword from "./pages/Forms/AddForbiddenkeyword";
export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <ToastContainer position="top-right" autoClose={2000} />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/new-teacher" element={<NewTeacher />} />
            <Route path="/add-school" element={<AddSchool />} />
            <Route path="/add-class" element={<AddClass />} />
            <Route path="/add-default-reply" element={<AddDefaultReply />} />
            <Route
              path="/add-Forbidden-Keyword"
              element={<AddForbiddenkeyword />}
            />
            {/* Tables */}
            <Route path="/schools" element={<School />} />
            <Route path="/classes" element={<Class />} />
            <Route path="/teachers" element={<Teacher />} />
            <Route path="/students" element={<Student />} />
            <Route path="/DefaultReply" element={<DefaultReply />} />
            <Route path="/Forbidden-Keyword" element={<ForbiddenKeyword />} />
            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
