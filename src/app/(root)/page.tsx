import { LOCALES, LOCALE_LABELS, LOCALE_STORAGE_KEY } from "@/i18n/config";
import regions from "@/i18n/regions.json";

// On Vercel, vercel.json already redirects "/" by saved choice or IP
// country before this page loads. This script is the fallback (other
// hosts, local runs): saved choice first (cookie or localStorage), then
// the region from the device's time zone, else English.
const redirect = `(function(){var ok=${JSON.stringify(LOCALES)},l=null;
try{var m=document.cookie.match(/(?:^|; )lang=(\\w+)/);l=m?m[1]:localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})}catch(e){}
if(ok.indexOf(l)<0){l="en";try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;
if(${JSON.stringify(regions.pt.timeZones)}.indexOf(z)>=0)l="pt";else if(${JSON.stringify(regions.es.timeZones)}.indexOf(z)>=0)l="es";}catch(e){}}
location.replace("/"+l+"/"+location.hash);})();`;

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
