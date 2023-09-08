import locations from "../../data/locations.json" assert { type: "json" };

export default async function Page(_req, ctx) {
  const r = await fetch("https://api.trafikinfo.trafikverket.se/v2/data.json", {
    method: "POST",
    body: getBody(ctx.params),
    headers: {
      "Content-Type": "application/xml",
      Accept: "application/json",
    },
  });
  if (!r.ok) return <div>{r.status} {r.statusText}</div>;

  const { RESPONSE } = await r.json();
  const [announcements] = RESPONSE.RESULT;

  return (
    <table>
      <caption>
        {locations[ctx.params.location]}
      </caption>
      {announcements.TrainAnnouncement.map((
        { AdvertisedTimeAtLocation, ToLocation },
      ) => (
        <tr>
          <td>{AdvertisedTimeAtLocation.substring(11, 16)}</td>
          {ToLocation.map(({ LocationName }) => (
            <td>{locations[LocationName]}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function getBody({ location }) {
  const now = Date.now();
  const since = new Date(now - 3 * 6e4).toISOString();
  const until = new Date(now + 2 * 60 * 6e4).toISOString();
  return `
<REQUEST>
  <LOGIN authenticationkey='${Deno.env.get("TRAFIKVERKET_API_KEY")}' />
     <QUERY objecttype='TrainAnnouncement' orderby='AdvertisedTimeAtLocation' sseurl='false' schemaversion='1.6'>
      <FILTER>
         <AND>
            <NE name='Canceled' value='true' />
            <EQ name='Advertised' value='true' />
            <EQ name='ActivityType' value='Avgang' />
            <EQ name='LocationSignature' value='${location}' />
            <OR>
               <GT name='AdvertisedTimeAtLocation' value='${since}' />
               <GT name='EstimatedTimeAtLocation' value='${since}' />
            </OR>
            <LT name='AdvertisedTimeAtLocation' value='${until}' />
         </AND>
      </FILTER>
      <INCLUDE>AdvertisedTimeAtLocation</INCLUDE>
      <INCLUDE>AdvertisedTrainIdent</INCLUDE>
      <INCLUDE>Deviation</INCLUDE>
      <INCLUDE>EstimatedTimeAtLocation</INCLUDE>
      <INCLUDE>FromLocation</INCLUDE>
      <INCLUDE>ProductInformation</INCLUDE>
      <INCLUDE>TimeAtLocation</INCLUDE>
      <INCLUDE>TimeAtLocationWithSeconds</INCLUDE>
      <INCLUDE>ToLocation</INCLUDE>
      <INCLUDE>TrackAtLocation</INCLUDE>
     </QUERY>
</REQUEST>`;
}
