import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "change-this-demo-secret"
);

export default async function Dashboard() {
  const token = (await cookies()).get("unicross_session")?.value;

  if (!token) redirect("/login");

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret));
  } catch {
    redirect("/login");
  }

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <a href="/" className="brand">
          <span className="brandMark">U</span>
          <span>UNICROSS Digital Campus</span>
        </a>
        <span className="roleBadge">{String(payload.role)}</span>
      </nav>

      <section className="portalHero">
        <div>
          <div className="eyebrow">SECURE WORKSPACE</div>
          <h1>Welcome to your campus dashboard.</h1>
          <p>
            Your role-based university workspace is ready. This is the first
            authenticated portal layer of the prototype.
          </p>
        </div>
      </section>

      <section className="portalGrid">
        {[
          "Profile",
          "Course Registration",
          "Results & GPA",
          "Fees & Payments",
          "Course Materials",
          "Notifications",
        ].map((item) => (
          <article className="portalCard" key={item}>
            <span>→</span>
            <h3>{item}</h3>
            <p>Module foundation ready for the next development phase.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
