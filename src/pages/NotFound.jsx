import { Link } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { useLanguage } from "../i18n/LanguageContext";

function NotFound() {
  const { t } = useLanguage();
  usePageTitle(t.notFound.pageTitle);

  return (
    <section className="not-found">
      <p className="not-found-code">{t.notFound.code}</p>
      <h1>
        {t.notFound.titleBefore}
        <span className="accent">{t.notFound.titleAccent}</span>.
      </h1>
      <p>{t.notFound.text}</p>
      <Link to="/" className="btn btn-primary">
        {t.notFound.back}
      </Link>
    </section>
  );
}

export default NotFound;
