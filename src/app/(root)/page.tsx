import { LOCALES, LOCALE_LABELS, LOCALE_STORAGE_KEY } from "@/i18n/config";

// Saved choice first, then the browser's languages, else English.
const redirect = `(function(){var l;try{l=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})}catch(e){}
var ok=${JSON.stringify(LOCALES)};if(ok.indexOf(l)<0){l=null;var n=navigator.languages||[navigator.language||"en"];
for(var i=0;i<n.length&&!l;i++){var c=String(n[i]).slice(0,2).toLowerCase();if(ok.indexOf(c)>=0)l=c;}}
location.replace("/"+(l||"en")+"/"+location.hash);})();`;

/** "/" picks a language and forwards; links work without JavaScript. */
export default function RootPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/en/" />
      </noscript>
      <p style={{ padding: 24 }}>
        {LOCALES.map((l) => (
          <a key={l} href={`/${l}/`} style={{ color: "#ff7a33", marginRight: 16 }}>
            {LOCALE_LABELS[l].name}
          </a>
        ))}
      </p>
    </>
  );
}
