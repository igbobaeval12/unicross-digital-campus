const modules = [
  { title: "Student Portal", text: "Registration, results, fees, materials and academic records.", icon: "🎓" },
  { title: "Lecturer Portal", text: "Courses, attendance, assessments, results and announcements.", icon: "👨‍🏫" },
  { title: "Administration", text: "Manage users, faculties, departments, programmes and sessions.", icon: "🏛️" },
  { title: "Finance", text: "Fees, payment records, collections and financial reporting.", icon: "₦" },
  { title: "Admissions", text: "Applications, screening information and admission tracking.", icon: "📝" },
  { title: "Analytics", text: "Institution-wide academic, student and operational insights.", icon: "📊" },
];

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></div>
        <div className="navLinks"><a href="#modules">Modules</a><a href="#about">About</a><a className="signInButton" href="/login">Sign in</a></div>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <div className="eyebrow">UNIVERSITY DIGITAL TRANSFORMATION • PROTOTYPE</div>
          <h1>One connected campus.<br /><span>Smarter university operations.</span></h1>
          <p>UNICROSS Digital Campus is a unified platform concept designed to bring student services, academics, administration, finance and communication into one modern digital experience.</p>
          <div className="actions"><button className="primary">Explore platform</button><button className="secondary">View proposal</button></div>
        </div>
        <div className="dashboardPreview" aria-label="Dashboard preview">
          <div className="previewTop"><b>Digital Campus</b><span>● System online</span></div>
          <div className="stats"><div><small>Students</small><strong>24,860</strong><em>+8.4%</em></div><div><small>Registrations</small><strong>18,420</strong><em>+12.1%</em></div><div><small>Fee collections</small><strong>₦428M</strong><em>+6.8%</em></div></div>
          <div className="previewBody"><div className="chart"><div className="chartTitle">Academic activity</div><div className="bars">{[42,68,51,82,64,91,74].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div><div className="activity"><b>Recent activity</b><p>✓ Results submitted</p><p>✓ Course registration opened</p><p>✓ New announcement published</p></div></div>
        </div>
      </section>

      <section id="modules" className="section"><div className="sectionHeading"><div><div className="eyebrow">PLATFORM</div><h2>Built around the university.</h2></div><p>A modular foundation that can grow from a presentation prototype into a production-ready institutional platform.</p></div><div className="grid">{modules.map(m=><article className="card" key={m.title}><div className="icon">{m.icon}</div><h3>{m.title}</h3><p>{m.text}</p><span>Explore module →</span></article>)}</div></section>

      <section id="about" className="about"><div><div className="eyebrow">OUR APPROACH</div><h2>Modernize the digital campus without losing the university structure.</h2></div><div><p>The platform is designed around role-based access, secure workflows, centralized data and clear audit trails. Each module can be implemented and tested independently before being connected to the wider campus ecosystem.</p><p className="note">Prototype only • Uses synthetic/demo data • Not connected to official UNICROSS production systems</p></div></section>

      <footer><span>© 2026 UNICROSS Digital Campus</span><span>Concept & prototype</span></footer>
    </main>
  );
}
