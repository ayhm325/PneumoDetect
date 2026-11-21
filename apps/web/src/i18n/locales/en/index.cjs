const navbar = require("./navbar.json");
const hero = require("./hero.json");
const footer = require("./footer.json");
const features = require("./features.json");
const workflowsection = require("./workflowsection.json");
const testimonialssection = require("./testimonialssection.json");
const content = require("./content.json");
const about = require("./about.json");
const blog = require("./blog.json");
const auth = require("./auth.json");
const signup = require("./signup.json");
const login = require("./login.json");
const contact = require("./content.json");
const faq = require("./faq.json");
const privacy = require("./privacy.json");
const navigation = require("./navigation.json");
const services = require("./services.json");
const terms = require("./terms.json");
const PatientsManagement = require("./PatientsManagement.json");
const DoctorsManagement = require("./DoctorsManagement.json");
const adminUsers = require("./adminUsers.json");
const adminSidebar = require("./adminSidebar.json");
const doctorsTable = require("./doctorsTable.json");
const DoctorChangeRequests = require("./doctorChangeRequests.json");
const patient = require("./patient.json");
const patientResults = require("./patientResults.json");
const patientSidebar = require("./patientSidebar.json");
const adminSettings = require("./adminSettings.json");
const doctorPatients = require("./doctorPatients.json");
const doctorSidebar = require("./doctorSidebar.json");
const doctorDashboard = require("./doctorDashboard.json");
const profile = require("./profile.json");
const patientChat = require("./patientChat.json");
const doctorResults = require("./doctorResults.json");
const doctorChat = require("./doctorChat.json");
const doctorAppointments = require("./doctorAppointments.json");
const doctorDetails = require("./doctorDetails.json");
const adminDashboard = require("./adminDashboard.json");
const doctorSettings =
  (require("./doctorSettings.json") || {}).doctorSettings ||
  require("./doctorSettings.json");
const doctorAnalytics = require("./doctorAnalytics.json");
const adminDoctors = require("./adminDoctors.json");
const adminChat = require("./adminChat.json");
const rootError = require("./rootError.json");
const doctorCommon = require("./doctorCommon.json");
const notifications = require("./notifications.json");
const logout = require("./logout.json");
const uploadXray = require("./uploadXray.json");
const adminPatients = require("./adminPatients.json");
const doctorTopbar = require("./doctorTopbar.json");
const forgotpasswordform = require("./forgotpasswordform.json");
const holoDemo = require("./holoDemo.json");
const doctorProfile = require("./doctorProfile.json");
const doctorFormModal = require("./doctorFormModal.json");

module.exports = {
  navbar,
  hero,
  footer,
  features,
  workflowsection,
  testimonialssection,
  content,
  about,
  blog,
  auth,
  signup,
  login,
  contact,
  faq,
  privacy,
  services,
  terms,
  patient,
  patientResults,
  patientSidebar,
  adminSidebar,
  adminUsers,
  PatientsManagement,
  DoctorsManagement,
  adminDoctors,
  adminChat,
  rootError,
  doctorResults,
  doctorChat,
  doctorAppointments,
  doctorSidebar,
  doctorDashboard,
  doctorsTable,
  DoctorChangeRequests,
  doctorChangeRequests: DoctorChangeRequests,
  adminSettings,
  patientChat,
  profile,
  navigation,
  doctorPatients,
  doctorSettings,
  doctorAnalytics,
  doctorCommon,
  doctorDetails,
  adminDashboard,
  notifications,
  logout,
  uploadXray,
  adminPatients,
  doctorTopbar,
  forgotpasswordform,
  holoDemo,
  doctorProfile,
  doctorFormModal,
};
