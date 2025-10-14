import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { throttle } from "lodash";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandEmpty, CommandItem, CommandList } from "./components/ui/command";
import { Calendar } from "./components/ui/calendar";
import { Alert, AlertTitle } from "./components/ui/alert";
import { ChevronDown, CircleAlert } from "lucide-react";
import { Spinner } from "./components/ui/spinner";
import { autocomplete, ensureFeatures, getPoints, search, type PeliasAutocompleteResponse, type Point, type SearchError } from "./geocoding";
import { getLegs, planConnection, type Leg } from "./routing";

function RouteSelection() {
  const [routes, setRoutes] = useState<Leg[][]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const findRoutes = (origin: Point, destination: Point, departure: boolean, time: Date) => {
    setHasSearched(true);
    setLoading(true);
    planConnection(origin, destination, departure, time)
      .then(getLegs)
      .then(setRoutes)
      .then(() => setNetworkError(false))
      .catch((err: Response) => {
        setNetworkError(true);
        console.error(`Error while fetching routes: ${err}`);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="w-full min-w-fit lg:w-fit lg:h-dvh">
      <TravelParameters onSearch={findRoutes} />
      <RouteList routes={routes} loading={loading} hasSearched={hasSearched} networkError={networkError} />
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
        props.onSearch(origin, destination, departure, new Date(`${date.toLocaleDateString("sv")} ${time}`)); // Ugly hack to copy date and time at once.
        setError(null);
      }).catch((err: SearchError) => {
        if (err.type == "network") {
          setError("A network error has ocurred.");
          console.error(`Error while fetching search results: ${err}`);
        } else if (err.type == "validation") {
          err.msg && setError(err.msg);
        }
      });
  };

  const departureId = useId();

  return (
    <form className="p-5" onSubmit={onSubmit}>
      {error ?
        <Alert className="mb-5" variant="destructive">
          <CircleAlert />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
        : <></>}
      <div className="flex flex-col gap-5">
        <AutocompletedSearch label="From" onChange={setOrigin} />
        <AutocompletedSearch label="To" onChange={setDestination} />
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-10">
          <div className="flex flex-row items-center">
            <Switch className="mr-2" id={departureId} checked={departure} onCheckedChange={setDeparture} />
            <Label className="w-full h-fit lg:w-20" htmlFor={departureId}>{departure ? "Departure" : "Arrival"}</Label>
          </div>
          <DateTimeSelection date={date} onDateChange={setDate} time={time} onTimeChange={setTime} />
        </div>
        <Button className="self-end w-full lg:w-35" type="submit">Search</Button>
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
      onOpenChange={setAutocompleteOpen}
    >
      <PopoverTrigger className="w-full">
        <Input
          value={value}
          onChange={e => onChange(e.currentTarget.value)}
          placeholder={props.label}
          aria-haspopup={autocompleteOpen}
          required
        />
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={e => e.preventDefault()}
        onCloseAutoFocus={e => e.preventDefault()}
        align="start"
      >
        <Command>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {autocompleteResults.map(result =>
              <CommandItem
                key={result.id}
                value={result.value}
                onSelect={value => {
                  onChange(value);
                  setAutocompleteOpen(false);
                }}
              >{result.value}</CommandItem>
            )}
          </CommandList>
        </Command>
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
            }}
          />
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
  routes: {}[];
  loading: boolean;
  hasSearched: boolean;
  networkError: boolean;
};
function RouteList(props: RouteListProps) {
  return (
    <Command>
      <CommandList>
        <CommandEmpty>
          {props.loading ?
            <div className="flex justify-center">
              <Spinner className="size-8" />
            </div> : (props.networkError ? "A network error has ocurred." : (props.hasSearched ? "No routes found." : <></>))}
        </CommandEmpty>
      </CommandList>
    </Command>
  );
}

export default RouteSelection;