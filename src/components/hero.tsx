import Link from "next/link";
import { ArrowDown, ArrowRight, AudioLines, Compass, MoveUpRight } from "lucide-react";
import { KundliArt } from "./kundli-art";
import styles from "./hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <h1>
            Your next chapter
            <br /> starts with a<br /> <em>conversation.</em>
          </h1>
          <p>
            Vedic wisdom, modern lives. Private astrology consultations for career crossroads, relationships, and
            finding your own way.
          </p>
          <div className={styles.actions}>
            <Link href="/astrologers" className="btn btn-gold">
              Find your astrologer <ArrowRight size={18} />
            </Link>
            <Link href="/#how-it-works" className={styles.secondary}>
              How it works <ArrowDown size={16} />
            </Link>
          </div>
          <div className={styles.languageNote}>
            <AudioLines size={20} />
            <span>
              Speak freely. Find a guide in your language.
              <Link href="#your-language">
                Explore languages <ArrowRight size={13} />
              </Link>
            </span>
          </div>
        </div>
        <div className={styles.visual}>
          <div className={styles.sun} aria-hidden="true" />
          <div className={styles.chart}>
            <KundliArt />
            <span>ROOTED IN TRADITION. OPEN TO POSSIBILITY.</span>
          </div>
          <Link className={styles.question} href="/astrologers?search=Career">
            <span>
              <Compass size={20} />A new direction?
            </span>
            <strong>
              Let&apos;s talk about
              <br />
              what comes next.
            </strong>
            <MoveUpRight size={21} />
          </Link>
          <div className={styles.chartCaption}>
            <span>Illustrative kundli</span>
            <span>Not a personal reading</span>
          </div>
        </div>
      </div>
      <div className={`container ${styles.footer}`}>
        <a href="#your-question">
          Big questions. A human connection. <ArrowDown size={15} />
        </a>
        <span>No fixed predictions. Your choices stay yours.</span>
      </div>
    </section>
  );
}
