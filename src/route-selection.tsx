import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { throttle } from "lodash";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { PELIAS_URL } from "./config";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandEmpty, CommandItem, CommandList } from "./components/ui/command";
import { Calendar } from "./components/ui/calendar";
import { Alert, AlertTitle } from "./components/ui/alert";

function RouteSelection() {
  return (
    <div>
      <TravelParameters />
      <RouteList />
    </div>
  );
}

type PeliasAutocompleteResponse = {
  features: {
    properties: {
      id: string,
      name: string,
      county: string,
    }
  }[],
};

function TravelParameters() {
  const [departure, setDeparture] = useState(true);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(`${date.getHours()}:${date.getMinutes()}`);


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const departureId = useId();

  return (
    <form className="p-5" onSubmit={onSubmit}>
      <Alert className="mb-5">
        <AlertTitle>kurwa error</AlertTitle>
      </Alert>
      <div className="flex flex-col">
        <AutocompletedSearch label="From" onChange={setOrigin} />
        <AutocompletedSearch label="To" onChange={setDestination} />
        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center mr-10">
            <Switch className="mr-5" id={departureId} checked={departure} onCheckedChange={setDeparture} />
            <Label htmlFor={departureId}>{departure ? "Departure" : "Arrival"}</Label>
          </div>
          <DateTimeSelection date={date} onDateChange={setDate} time={time} onTimeChange={setTime} />
          <Button type="submit" className="float-right">Search</Button>
        </div>
      </div>
    </form>
  );
}

type AutocompletedSearchProps = {
  label: string,
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
      fetch(PELIAS_URL + "/autocomplete?" + new URLSearchParams({
        text: throttledValue,
        layers: "venue,address",
        size: "5",
        lang: "sv",
        "boundary.gid": "whosonfirst:region:85688377", // Keep searches contained within Skåne
        "focus.point.lat": "55.7029296", // Focus on Lund
        "focus.point.lon": "13.1929449",
      }).toString())
        .then(res => {
          if (res.ok) {
            return res.json();
          } else {
            throw res;
          }
        })
        .then((data: PeliasAutocompleteResponse) => {
          setAutocompleteResults(
            data.features.map(feature => {
              return {
                value: `${feature.properties.name}, ${feature.properties.county}`,
                id: feature.properties.id
              };
            })
          );
        })
    } else {
      setAutocompleteResults([]);
    }
  }, [throttledValue]);

  return (
    <div className="mb-5">
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
    </div>
  );
}

type DateTimeSelectionProps = {
  date: Date,
  onDateChange: (date: Date) => void,
  time: string,
  onTimeChange: (time: string) => void
};
function DateTimeSelection(props: DateTimeSelectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-row">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button>{props.date.toLocaleDateString()}</Button>
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
      <Input type="time" value={props.time} onChange={e => props.onTimeChange(e.currentTarget.value)} />
    </div>
  );
}

function RouteList() {
  return (
    <ul>
    </ul>
  );
}

export default RouteSelection;