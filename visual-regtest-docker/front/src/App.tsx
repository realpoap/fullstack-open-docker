import { Alert, AlertDescription, } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { ImageCompareSlider } from './components/ImageCompareSlider';
import { Spinner } from './components/ui/spinner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from './components/ui/input';

import './App.css';
import { useDiffState } from './store/diff';

const backendURL = import.meta.env.VITE_BACKEND_URL;

type DateObject = {
  [key: string]: string[];
};

type FolderItem = {
  [key: string]: Array<{
    [key: string]: string[];
  } | string>;
};

type DateWithString = {
  dateStr: string;
  date: Date;
};

// Add date parsing function
const parseCustomDate = (dateStr: string): Date => {
  // Split the date string at 'T' to separate date and time
  const [datePart, timePart] = dateStr.split('T');
  // Replace hyphens with colons only in the time part
  const standardTimePart = timePart.replace(/-/g, ':');
  // Recombine with 'T'
  const standardDateStr = `${datePart}T${standardTimePart}`;
  return new Date(standardDateStr);
};

function App() {
  const { url, creds, delay, setUrl, setCreds, setDelay, searchTerm, setSearchTerm, alert, setAlert, folderList, setFolderList } = useDiffState()
  const [selectedDate, setSelectedDate] = useState<string>();
  const [latestDate, setLatestDate] = useState<string>();
  const [diffResult, setDiffResult] = useState();

  useEffect(() => {
    if (url) {
      try {
        // Add default protocol if not present
        const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `https://${url}`;
        const domain = new URL(urlWithProtocol).hostname.replace(/^www\./, '');
        setSearchTerm(domain);
        console.log(domain);
      } catch (error) {
        console.error('Invalid URL:', error);
        setSearchTerm('');
      }
    } else {
      setSearchTerm('');
    }
  }, [setSearchTerm, url]);

  useEffect(() => {
    setSelectedDate(undefined)
  }, [searchTerm])

  useEffect(() => {
    const fetchFolderList = async () => {
      try {
        const list = await getFolderList();
        setFolderList(list);

        // Set the latest date when folder list is fetched
        const filteredFolders = list.filter((folder: FolderItem) => {
          const folderName = Object.keys(folder)[0];
          return folderName === searchTerm;
        });

        if (filteredFolders.length > 0) {
          const folder = filteredFolders[0];
          const folderName = Object.keys(folder)[0];
          const items = folder[folderName];

          // Filter out non-date objects and get only the date objects
          const dateObjects = items.filter((item: unknown): item is DateObject =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
          );

          if (dateObjects.length > 0) {
            // Sort dates in descending order (newest first)
            const sortedDates = dateObjects
              .map((dateObj: DateObject) => {
                const dateStr = Object.keys(dateObj)[0];
                // Log the date string and its parsed value
                console.log('Date string:', dateStr, 'Parsed date:', parseCustomDate(dateStr));
                return {
                  dateStr,
                  date: parseCustomDate(dateStr)
                };
              })
              .sort((a: DateWithString, b: DateWithString) => {

                return b.date.getTime() - a.date.getTime();
              });

            // Log the final sorted array
            console.log('Final sorted dates:', sortedDates.map((d: DateWithString) => d.dateStr));

            // Set the latest date (first one after sorting)
            const latestDate = sortedDates[0]?.dateStr;
            setLatestDate(latestDate);
          }
        }
      } catch (error) {
        console.error('Error fetching folder list:', error);
        setAlert({ message: 'Failed to fetch folder list', type: 'destructive' });
      }
    };
    fetchFolderList();
  }, [searchTerm, setAlert, setFolderList]);

  const getFolderList = async () => {
    const response = await fetch(`${backendURL}/capture/list`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch folder list');
    }
    return response.json();
  }

  const captureUrl = async (url: string) => {
    try {
      // Add default protocol if not present
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;

      setAlert({ message: <p className='flex flex-row gap-2'><Spinner size="small" /><span>Processing screenshot request</span></p>, type: 'default' });
      const response = await fetch(`${backendURL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlWithProtocol, creds, delay })
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Backend response data:', data);
        setAlert({ message: 'Screenshot captured successfully!', type: 'success' });
        setTimeout(() => {
          setAlert({ message: '', type: 'default' });
        }, 3000)
        setDiffResult(undefined);
        console.log('Screenshot path set to:', data.path);

        // Update folder list after successful capture
        try {
          const listResponse = await fetch(`${backendURL}/capture/list`, {
            method: 'GET',
          });
          if (listResponse.ok) {
            const updatedList = await listResponse.json();
            setFolderList(updatedList);
          }
        } catch (error) {
          console.error('Error updating folder list:', error);
        }
      } else {
        setAlert({ message: 'Failed to capture screenshot', type: 'destructive' });
        setTimeout(() => {
          setAlert({ message: '', type: 'default' });
        }, 3000)
      }
    } catch (error) {
      console.error('Error capturing URL:', error);
      setAlert({ message: 'Error capturing screenshot', type: 'destructive' });
      setTimeout(() => {
        setAlert({ message: '', type: 'default' });
      }, 3000)
    }
  }

  const compareUrl = async (url: string) => {
    console.log('Latest date:', latestDate, 'Selected date:', selectedDate);
    const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    // Parse the selected date to ensure it's valid
    if (selectedDate) {
      const parsedSelectedDate = parseCustomDate(selectedDate);
      if (isNaN(parsedSelectedDate.getTime())) {
        setAlert({ message: 'Invalid date format for comparison', type: 'destructive' });
        return;
      }
    }

    // Ensure we have a latest date
    if (!latestDate) {
      setAlert({ message: 'No latest capture available for comparison', type: 'destructive' });
      return;
    }

    const response = await fetch(`${backendURL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: urlWithProtocol,
        date: selectedDate, // The date to compare against
        latestDate: latestDate // Always use the latest date as the reference
      })
    });
    if (response.ok) {
      const data = await response.json();
      console.log('Comparing URL:', data);
      if (data.match === true) {
        setAlert({ message: '✌️ No difference found', type: 'success' });
        setTimeout(() => {
          setAlert({ message: '', type: 'default' });
        }, 3000)
      } else if (data.match !== true) {
        setAlert({ message: `Difference found : ${data.diffPercentage.toFixed(1)}%`, type: 'warning' });
      }
      setDiffResult(data.diffPath);
      console.log('Diff path set to:', data.diffPath);
    }
  }

  return (
    <div className='flex flex-col items-center gap-4 justify-center '>
      <h1 className='text-2xl font-bold uppercase'>Visual Regression Tester</h1>
      <div className='flex flex-col gap-2 w-full items-center'>
        <Input
          className='w-1/2'
          type="text"
          id="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter the URL you want to snapshot"
          autoFocus />
      </div>
      {url &&
        <div className='flex flex-row gap-2 w-1/2' >
          <div className='flex flex-col w-full items-start justify-end'>
            <p className='text-stone-700 text-sm pl-1 font-medium mb-2'>Options</p>
            <div className='flex flex-col gap-2 items-start w-full'>
              <Input
                className='w-full'
                type="text"
                id="username-input"
                name='username'
                placeholder="Enter username"
                value={creds?.username}
                onChange={(e) => setCreds({ ...creds, username: e.target.value })}
              />
              <Input
                className='w-full'
                type="password"
                id="password-input"
                placeholder="Enter password"
                value={creds?.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              />
            </div>
          </div>
          <div className='flex items-start justify-end flex-col gap-2'>
            <div className='flex gap-2 items-end'>
              <Input
                className='w-1/3 text-sm'
                type='number'
                placeholder='Delay'
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              />
              <span className='text-sm text-stone-700'>ms</span>
              <Button className='flex-1' onClick={() => captureUrl(url)}>Capture</Button>
            </div>
            <div className='flex gap-2'>
              <Select
                value={selectedDate}
                onValueChange={(value) => {
                  setSelectedDate(value);
                  setDiffResult(undefined);
                }}
              >
                <SelectTrigger className="w-1/4 flex-1">
                  <SelectValue placeholder="Select comparison date" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    if (!folderList.length) return null;

                    const filteredFolders = folderList.filter(folder => {
                      const folderName = Object.keys(folder)[0];
                      return folderName === searchTerm;
                    });

                    if (!filteredFolders.length) return null;

                    return filteredFolders.map((folder) => {
                      const folderName = Object.keys(folder)[0];
                      const items = folder[folderName];

                      // Filter out non-date objects and get only the date objects
                      const dateObjects = items.filter((item: unknown): item is DateObject =>
                        typeof item === 'object' && item !== null && !Array.isArray(item)
                      );

                      // Sort dates in descending order (newest first)
                      const sortedDates = dateObjects
                        .map((dateObj: DateObject) => {
                          const dateStr = Object.keys(dateObj)[0];
                          return {
                            dateStr,
                            date: parseCustomDate(dateStr)
                          };
                        })
                        .sort((a: DateWithString, b: DateWithString) => {

                          return b.date.getTime() - a.date.getTime();
                        });

                      // Log the final sorted array
                      console.log('Final sorted dates:', sortedDates.map((d: DateWithString) => d.dateStr));

                      // Return all dates, with the latest one being unselectable
                      return sortedDates.map(({ dateStr }, index) => (
                        <SelectItem
                          key={`${folderName}-${dateStr}`}
                          value={dateStr}
                          disabled={index === 0} // Disable the first item (latest date)
                        >
                          {dateStr} {index === 0 ? '(Latest)' : ''}
                        </SelectItem>
                      ));
                    });
                  })()}
                </SelectContent>
              </Select>
              <Button onClick={() => compareUrl(url)}>Compare</Button></div>
          </div>
        </div >
      }

      {
        alert && <Alert variant={alert.type ?? 'default'} className='w-1/2 items-center justify-center duration-500' >
          <AlertDescription className='duration-500'>
            {alert.message}
          </AlertDescription>
        </Alert>
      }

      {!diffResult && selectedDate && <div className='w-full border-2 rounded-lg max-h-[80vh] overflow-auto'>
        <img src={`${backendURL}/snapshots/${searchTerm}/${selectedDate}/root.png`} alt='Selected only' className="w-full"></img>
      </div>}

      {diffResult && <div className='w-full border-2 rounded-lg max-h-[80vh]'>
        <div className="relative w-full h-[600px] overflow-auto">
          <ImageCompareSlider
            image1={`${backendURL}/snapshots/${searchTerm}/${selectedDate}/root.png`}
            image2={`${backendURL}/snapshots/${searchTerm}/${latestDate}/root.png`}
            diffImage={`${backendURL}/${diffResult}`}
            className="absolute inset-0"
          />
        </div>
      </div>}

    </div >
  )
}

export default App

