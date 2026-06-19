import type { Story } from "@/lib/types";

export default function StoriesGrid({ stories }: { stories: Story[] }) {
  return (
    <section className="stories">
      <div className="wrap">
        <div className="sec-eye">Stories &amp; Campaign</div>
        <h2 className="sec-title">함께 만드는 변화</h2>
        <div className="story-grid">
          {stories.map((s) => (
            <article
              className={`story ${s.variant}${s.featured ? "" : " sm"}`}
              key={s.variant}
            >
              <div className="k">{s.kicker}</div>
              <h3>
                {s.title.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < s.title.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </h3>
              {s.desc && <p>{s.desc}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
