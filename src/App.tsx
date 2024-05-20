import Fuse from "fuse.js";
import { useEffect, useRef, useState } from "react";
import Map, { Layer, MapProvider, MapRef, Source } from "react-map-gl";
import { Author } from ".";
import data from "../data.json";
import "./App.css";
import shuffleIcon from "./assets/shuffle.svg";
import AuthorCard from "./components/AuthorCard";
import AuthorDetails from "./components/AuthorDetails";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

function App() {
  const mapRef = useRef<MapRef>();
  const fuse = new Fuse<GeoJSON.Feature<GeoJSON.Geometry, Author>>(
    data.features as GeoJSON.Feature<GeoJSON.Geometry, Author>[],
    {
      keys: [
        "properties.author_name",
        "properties.work_1",
        "properties.work_2",
      ],
    },
  );
  const [activeAuthor, setActiveAuthor] = useState<Author | null>(null);
  const [searchResults, setSearchResults] = useState<
    GeoJSON.Feature<GeoJSON.Geometry, Author>[]
  >([]);
  useEffect(() => {
    const geometry = data.features.find(
      (feature) => feature.properties.author_name === activeAuthor?.author_name,
    )?.geometry;
    if (geometry && mapRef.current) {
      mapRef.current.flyTo({
        center: geometry.coordinates as [number, number],
        zoom: 10,
      });
    }
  }, [activeAuthor, mapRef]);
  return (
    <>
      <MapProvider>
        <div id="map">
          <Map
            ref={mapRef}
            onMoveEnd={({ target: map }) => {
              if (!activeAuthor) {
                const visibleFeatures = map.queryRenderedFeatures(undefined, {
                  layers: ["unclustered-point", "clusters"],
                });
                setSearchResults(
                  visibleFeatures as unknown as GeoJSON.Feature<
                    GeoJSON.Geometry,
                    Author
                  >[],
                );
              }
            }}
            id={"authorsMap"}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/gyanl/cls90czva01au01pld9fc7b5x"
            mapboxAccessToken={
              "pk.eyJ1IjoiZ3lhbmwiLCJhIjoiY2swNmNoY29kMDA2ZzNjbWN4MmRvbHlmYiJ9.HJHfadzLE1cNqce2G51BEQ"
            }
          >
            <Source
              id={"authors"}
              type={"geojson"}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
              data={data as GeoJSON.FeatureCollection<GeoJSON.Geometry, Author>}
            />
            <Layer
              id={"clusters"}
              type={"circle"}
              source={"authors"}
              filter={["has", "point_count"]}
            />
            <Layer
              id={"cluster-count"}
              type={"symbol"}
              source={"authors"}
              filter={["has", "point_count"]}
              layout={{
                "text-field": "{point_count_abbreviated}",
                "text-size": 16,
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              }}
            />
            <Layer
              id={"unclustered-point"}
              type={"circle"}
              source={"authors"}
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-color": "#67FAAF",
                "circle-radius": 10,
              }}
            />
          </Map>
        </div>
        <Header>
          <div className="header-controls">
            <label
              htmlFor="search-bar"
              aria-hidden="false"
              style={{ visibility: "hidden" }}
            >
              Search
            </label>
            <input
              type="text"
              id="search-bar"
              placeholder="Search for your favourite author"
              onInput={(e) => {
                const searchResults = fuse.search(e.currentTarget.value);
                setSearchResults(searchResults.map((result) => result.item));
              }}
            />
            <button className="button button-primary" id="btnRandom">
              <img src={shuffleIcon} alt="Shuffle" />
            </button>
          </div>
        </Header>
        <Sidebar active={activeAuthor !== null} setActive={setActiveAuthor}>
          <div id="sidebar-body" className="sidebar-body">
            {activeAuthor === null &&
              searchResults.map((result, index) => (
                <AuthorCard
                  author={result.properties}
                  key={index}
                  setAuthor={setActiveAuthor}
                />
              ))}
          </div>
          <div id="sidebar-author-details" className="sidebar-author-details">
            {activeAuthor && <AuthorDetails author={activeAuthor} />}
          </div>
        </Sidebar>
      </MapProvider>
    </>
  );
}

export default App;
