/**
 * Head asset helpers (course practice pattern).
 */
const setHeadAssetsFunctionality = (res) => {
  res.locals.styles = [];
  res.locals.scripts = [];

  res.addStyle = (css, priority = 0) => {
    res.locals.styles.push({ content: css, priority });
  };

  res.addScript = (js, priority = 0) => {
    res.locals.scripts.push({ content: js, priority });
  };

  res.locals.renderStyles = () => {
    return res.locals.styles
      .sort((a, b) => b.priority - a.priority)
      .map((item) => item.content)
      .join("\n");
  };

  res.locals.renderScripts = () => {
    return res.locals.scripts
      .sort((a, b) => b.priority - a.priority)
      .map((item) => item.content)
      .join("\n");
  };
};

/**
 * Global template locals (matches CSE_340_Practice shape).
 */
const addLocalVariables = (req, res, next) => {
  setHeadAssetsFunctionality(res);

  res.locals.currentYear = new Date().getFullYear();
  res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || "production";
  res.locals.queryParams = { ...req.query };
  res.locals.user = req.session?.user ?? null;
  res.locals.isLoggedIn = Boolean(req.session?.user);

  next();
};

export { addLocalVariables };
