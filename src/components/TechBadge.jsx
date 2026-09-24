import technoIcons from "../data/technoIcons";

function TechBadge({ name }) {
  const slug = technoIcons[name];

  return (
    <li className="tech-badge">
      {slug && (
        <img
          src={`https://cdn.simpleicons.org/${slug}/d6bf94`}
          alt=""
          width="20"
          height="20"
        />
      )}
      {name}
    </li>
  );
}

export default TechBadge;
