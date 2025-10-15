import { useEffect, useId, useMemo, useState, type FormEvent, type ReactElement } from "react";
import { throttle } from "lodash";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Calendar } from "./components/ui/calendar";
import { Alert, AlertTitle } from "./components/ui/alert";
import { BusFront, ChevronDown, CircleAlert, Clock, Footprints, TrainFront, TramFront } from "lucide-react";
import { Spinner } from "./components/ui/spinner";
import { autocomplete, ensureFeatures, getPoints, search, type PeliasAutocompleteResponse, type Point, type SearchError } from "./geocoding";
import { duration, extractRoutes, keyFromRoute, planConnection, timeFromScheduledTime, type Mode, type Route } from "./routing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { Separator } from "./components/ui/separator";

type RouteSelectionProps = {
  selectedRoute: Route | null;
  onRouteSelect: (route: Route | null) => void;
};
function RouteSelection(props: RouteSelectionProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const findRoutes = (origin: Point, destination: Point, departure: boolean, time: Date) => {
    setHasSearched(true);
    setLoading(true);
    props.onRouteSelect(null);
    planConnection(origin, destination, departure, time)
      .then(extractRoutes)
      .then(setRoutes)
      .then(() => setNetworkError(false))
      .catch((err: Response) => {
        setNetworkError(true);
        console.error(`Error while fetching routes: ${err}`);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col w-full h-dvh min-w-120 lg:w-fit h-dvh">
      <TravelParameters onSearch={findRoutes} />
      <Separator />
      <RouteList
        routes={routes}
        selectedRoute={props.selectedRoute}
        onRouteSelect={props.onRouteSelect}
        loading={loading}
        hasSearched={hasSearched}
        networkError={networkError} />
    </div>
  );
}

type TravelParametersProps = {
  onSearch: (origin: Point, destination: Point, departure: boolean, time: Date) => void;
};
function TravelParameters(props: TravelParametersProps) {
  const [departure, setDeparture] = useState(true);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  const [error, setError] = useState<string | null>(null);


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const originRequest = search(origin);
    const destinationRequest = search(destination);

    Promise.all([originRequest, destinationRequest])
      .then(ensureFeatures)
      .then(getPoints)
      .then(({ origin, destination }: { origin: Point, destination: Point }) => {
        props.onSearch(
          origin,
          destination,
          departure,
          new Date(`${date.toLocaleDateString("sv")} ${time}`)); // Ugly hack to copy date and time at once.

        setError(null);
      }).catch((err: SearchError) => {
        if (err.type == "network") {
          setError("A network error has occurred.");
          console.error(`Error while fetching search results: ${err}`);
        } else if (err.type == "validation") {
          err.msg && setError(err.msg);
        }
      });
  };

  const departureId = useId();

  return (
    <form className="p-8" onSubmit={onSubmit}>
      {error ?
        <Alert className="mb-5" variant="destructive">
          <CircleAlert />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
        : <></>}
      <div className="flex flex-col gap-5">
        <AutocompletedSearch label="From" onChange={setOrigin} />
        <AutocompletedSearch label="To" onChange={setDestination} />
        <div className="flex flex-col gap-5 justify-between lg:flex-row lg:gap-10">
          <div className="flex flex-row items-center">
            <Switch className="mr-2" id={departureId} checked={departure} onCheckedChange={setDeparture} />
            <Label className="w-full h-fit lg:w-20" htmlFor={departureId}>{departure ? "Departure" : "Arrival"}</Label>
          </div>
          <DateTimeSelection date={date} onDateChange={setDate} time={time} onTimeChange={setTime} />
        </div>
        <Button className="w-full" type="submit">Search</Button>
      </div>
    </form>
  );
}


type AutocompletedSearchProps = {
  label: string;
  onChange: (value: string) => void;
};
function AutocompletedSearch(props: AutocompletedSearchProps) {
  const [autocompleteResults, setAutocompleteResults] = useState<{ value: string, id: string }[]>([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [throttledValue, setThrottledValue] = useState("");
  const [value, setValue] = useState("");

  // If the value is updated too often the API gets spammed, not good!
  const updateThrottled = useMemo(() => throttle(setThrottledValue, 200), []);
  const onChange = (value: string) => {
    setValue(value);
    updateThrottled(value);

    props.onChange(value);
  };

  useEffect(() => {
    if (throttledValue) {
      autocomplete(throttledValue)
        .then((data: PeliasAutocompleteResponse) => {
          setAutocompleteResults(data.features.map(feature => { return { value: `${feature.properties.name}, ${feature.properties.county}`, id: feature.properties.id }; }));
        }, (err: Response) => {
          console.error(`Error while fetching autocomplete results: ${err}`);
        });
    } else {
      setAutocompleteResults([]);
    }
  }, [throttledValue]);

  return (
    <Popover
      open={
        autocompleteOpen &&
        value != "" &&
        !autocompleteResults.find(result => result.value == value.trim())
      }
      onOpenChange={setAutocompleteOpen}>
      <PopoverTrigger className="w-full">
        <Input
          value={value}
          onChange={e => onChange(e.currentTarget.value)}
          placeholder={props.label}
          aria-haspopup={autocompleteOpen}
          required />
      </PopoverTrigger>
      <PopoverContent
        className="flex flex-col"
        onOpenAutoFocus={e => e.preventDefault()}
        onCloseAutoFocus={e => e.preventDefault()}
        align="start">
        {autocompleteResults.length == 0 ? <div>No results found.</div> :
          autocompleteResults.map(result =>
            <button
              className="text-left min-h-8 pb-4 cursor-pointer"
              key={result.id}
              onClick={() => {
                onChange(result.value);
                setAutocompleteOpen(false);
              }}>{result.value}</button>)}
      </PopoverContent>
    </Popover>
  );
}

type DateTimeSelectionProps = {
  date: Date;
  onDateChange: (date: Date) => void;
  time: string;
  onTimeChange: (time: string) => void;
};
function DateTimeSelection(props: DateTimeSelectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-row">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="mr-2 w-2/3 lg:w-30" asChild>
          <Button>
            {props.date.toLocaleDateString("sv")}
            <ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={props.date}
            onSelect={date => {
              date && props.onDateChange(date);
              setOpen(false);
            }} />
        </PopoverContent>
      </Popover>
      <Input
        className="w-1-3 text-center lg:w-20"
        type="time"
        value={props.time}
        onChange={e => {
          if (e.currentTarget.value.length == 5) {
            props.onTimeChange(e.currentTarget.value)
          }
        }} />
    </div>
  );
}

type RouteListProps = {
  routes: Route[];
  selectedRoute: Route | null;
  onRouteSelect: (route: Route | null) => void;
  loading: boolean;
  hasSearched: boolean;
  networkError: boolean;
};
function RouteList(props: RouteListProps) {

  if (props.networkError) {
    return (<div className="flex justify-center items-center h-full">A network error has occurred.</div>);
  }

  if (props.loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (props.routes.length == 0) {
    if (props.hasSearched) {
      return (<div className="flex justify-center items-center h-full">No routes found.</div>);
    }
    return (<div className="flex justify-center items-center h-full"></div>);
  }

  return (
    <div className="flex flex-col w-full h-full gap-2 pt-5 px-5 overflow-auto">
      {props.routes.map(route =>
        <RouteItem
          key={keyFromRoute(route)}
          route={route}
          selected={route == props.selectedRoute}
          onSelect={props.onRouteSelect} />)}
    </div>
  );
}

type RouteItemProps = {
  route: Route;
  selected: boolean;
  onSelect: (route: Route | null) => void;
};
function RouteItem(props: RouteItemProps) {
  return (
    <Collapsible open={props.selected} onOpenChange={open => props.onSelect(open ? props.route : null)}>
      <CollapsibleTrigger className="w-full cursor-pointer">
        <RouteSummary route={props.route} />
        <Separator className="mt-2 mx-2" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4">
        <RouteDetails route={props.route} />
      </CollapsibleContent>
    </Collapsible>
  );
}

type RouteSummaryProps = {
  route: Route;
};
function RouteSummary(props: RouteSummaryProps) {
  const firstLeg = props.route[0];
  const lastLeg = props.route[props.route.length - 1];
  if (firstLeg == lastLeg) {
    return <TransitSegment route={props.route} />;
  }

  return (
    <div className="flex flex-row w-full justify-center">
      {firstLeg.mode == "WALK" &&
        <div className="flex mr-2 py-1">
          <WalkSegment
            time={
              timeFromScheduledTime(
                firstLeg
                  .start
                  .scheduledTime)}
            distance={firstLeg.distance} />
          <Separator orientation="vertical" />
        </div>}
      <TransitSegment route={props.route} />
      {lastLeg.mode == "WALK" &&
        <div className="flex ml-2 py-1">
          <Separator orientation="vertical" />
          <WalkSegment
            time={
              timeFromScheduledTime(
                props.route[props.route.length - 1]
                  .end
                  .scheduledTime)}
            distance={props.route[props.route.length - 1].distance} />
        </div>}
    </div>
  );
}


type WalkSegmentProps = {
  time: string;
  distance: number;
};
function WalkSegment(props: WalkSegmentProps) {
  return (
    <div className="flex flex-col w-12 p-1 items-center">
      <div className="text-xs">{props.time}</div>
      <div className="text-xs">
        {props.distance >= 1000 ?
          `${(props.distance / 1000).toPrecision(2)} km` :
          `${Math.round(props.distance)} m`}
      </div>
      <Footprints className="mt-auto size-5" />
    </div>
  );
}

type TransitSegmentProps = {
  route: Route;
};
function TransitSegment(props: TransitSegmentProps) {
  if (props.route.length == 1 && props.route[0].mode == "WALK") {
    const leg = props.route[0];
    const time = duration(leg, leg);

    return (
      <div className="w-full p-1 px-4 h-12">
        <div className="flex justify-between">
          <span className="text-sm">{leg.from.name}</span>
          <span className="text-sm">{time}</span>
        </div>
        <div className="flex flex-row">
          <Footprints className="size-5 mr-2" />
          <span className="text-sm">Walk, {`${Math.round(leg.distance)} m`}</span>
        </div>
      </div>
    );
  }

  const firstTransit = props.route.find(leg => leg.mode != "WALK");
  const lastTransit = props.route.findLast(leg => leg.mode != "WALK");
  const transitLegs = props.route.filter(leg =>
    !(leg == props.route[0] && leg.mode == "WALK") &&
    !(leg == props.route[props.route.length - 1] && leg.mode == "WALK"));
  if (!firstTransit || !lastTransit) {
    return null;
  }
  const time = duration(firstTransit, lastTransit);

  return (
    <div className="flex flex-col w-full h-20">
      <div className="flex flex-row">
        <div className="flex flex-col items-start w-fit">
          <span className="text-lg">{timeFromScheduledTime(firstTransit.start.scheduledTime)}</span>
          <span className="text-sm">
            {firstTransit.from.name}, {firstTransit.mode != "RAIL" ? "Position" : "Track"} {firstTransit.from.stop && firstTransit.from.stop.platformCode}
          </span>
        </div>
        <div className="flex flex-col items-end w-fit ml-auto">
          <span className="text-lg">{timeFromScheduledTime(lastTransit.end.scheduledTime)}</span>
          <span className="text-sm">{time}</span>
        </div>
      </div>
      <div className="flex flex-row h-full">
        {transitLegs.map(leg =>
          <div className="flex flex-row items-center w-full h-full text-sm">
            {icons[leg.mode]}
            <span className="ml-1">
              {transitLegs.length <= 2 && leg.route && leg.route.desc} {leg.route && leg.route.shortName}
              {leg.mode == "WALK" && distanceFormat(leg.distance)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

type RouteDetailsProps = {
  route: Route
};
function RouteDetails(props: RouteDetailsProps) {
  const firstLeg = props.route[0];
  const lastLeg = props.route[props.route.length - 1];

  console.log(lastLeg);
  console.log(duration(lastLeg, lastLeg));

  return (
    <div>
      {props.route.map(leg =>
        <div key={`${leg.start.scheduledTime} ${leg.end.scheduledTime}`}>
          <div className="flex flex-row my-2">
            <div className="text-xs w-10">{timeFromScheduledTime(leg.start.scheduledTime)}</div>
            <div>
              <div className="text-sm">
                {leg.mode == "WALK" &&
                  (leg == firstLeg ? "from " : leg == lastLeg ? "to " : "Walk to ")}
                {(leg.mode != "WALK" || leg == firstLeg) ? leg.from.name : leg.to.name}
              </div>
              {!(leg == firstLeg || leg == lastLeg) &&
                <div className="text-xs">
                  {((leg.mode == "WALK" && leg.to.stop && leg.to.stop.vehicleMode != "RAIL") ||
                    (leg.mode != "WALK" && leg.mode != "RAIL")) ? "Position" : "Track"} {leg.mode != "WALK" ?
                      (leg.from.stop && leg.from.stop.platformCode) :
                      (leg.to.stop && leg.to.stop.platformCode)}
                </div>}
              <div className="flex flex-row items-center">
                {iconsSmall[leg.mode]}
                <span className="text-xs ml-1">
                  {leg.route && leg.route.desc} {leg.route && leg.route.shortName}
                  {leg.mode == "WALK" && `Distance ${distanceFormat(leg.distance)}, walk time ${duration(leg, leg)}`}
                </span>
              </div>
            </div>
          </div>
          {leg.mode != "WALK" &&
            <div className="flex flex-row mt-4 mb-2">
              <div className="text-xs w-10">{timeFromScheduledTime(leg.end.scheduledTime)}</div>
              <div>
                <div className="text-sm">{leg.to.name}</div>
                <div className="text-xs">{leg.mode != "RAIL" ? "Position" : "Track"} {leg.to.stop && leg.to.stop.platformCode}</div>
                <div className="flex flex-row items-center text-xs">
                  <Clock className="size-3" />
                  <span className="ml-1">Travel time {duration(leg, leg)}</span>
                </div>
              </div>
            </div>}
          <Separator />
        </div>)}
    </div>
  );
}

const icons: { [Key in Mode]?: ReactElement } = {
  "WALK": <Footprints className="size-5" />,
  "BUS": <BusFront className="size-5" />,
  "TRAM": <TramFront className="size-5" />,
  "RAIL": <TrainFront className="size-5" />,
};

const iconsSmall: { [Key in Mode]?: ReactElement } = {
  "WALK": <Footprints className="size-3" />,
  "BUS": <BusFront className="size-3" />,
  "TRAM": <TramFront className="size-3" />,
  "RAIL": <TrainFront className="size-3" />,
};

function distanceFormat(distance: number) {
  return distance >= 1000 ?
    `${(distance / 1000).toPrecision(2)} km` :
    `${Math.round(distance)} m`;
}

export default RouteSelection;