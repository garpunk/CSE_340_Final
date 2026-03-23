/**
 * Basic site pages (course practice pattern: thin controllers).
 */
const homePage = (req, res) => {
  res.render("home", { title: "Welcome Home" });
};

const aboutPage = (req, res) => {
  res.render("about", { title: "About Me" });
};

const servicesPage = (req, res) => {
  res.render("services", { title: "Our Services" });
};

const testErrorPage = (req, res, next) => {
  const err = new Error("This is a test error");
  err.status = 500;
  next(err);
};

export { homePage, aboutPage, servicesPage, testErrorPage };
