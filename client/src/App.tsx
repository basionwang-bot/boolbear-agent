import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Square from "./pages/Square";
import Adopt from "./pages/Adopt";
import BearGallery from "./pages/BearGallery";
import AuthPage from "./pages/AuthPage";
import Admin from "./pages/Admin";
import ParentReport from "./pages/ParentReport";
import Courses from "./pages/Courses";
import ClassroomList from "./pages/ClassroomList";
import ClassroomView from "./pages/ClassroomView";
import ExamAnalysis from "./pages/ExamAnalysis";
import ExamShareReport from "./pages/ExamShareReport";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/chat" component={Chat} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/square" component={Square} />
      <Route path="/adopt" component={Adopt} />
      <Route path="/gallery" component={BearGallery} />
      <Route path="/admin" component={Admin} />
      <Route path="/courses" component={Courses} />
      <Route path="/classroom" component={ClassroomList} />
      <Route path="/classroom/:id" component={ClassroomView} />
      <Route path="/exam" component={ExamAnalysis} />
      <Route path="/exam/share/:token" component={ExamShareReport} />
      <Route path="/exam/:id" component={ExamAnalysis} />
      <Route path="/parent/:token" component={ParentReport} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
