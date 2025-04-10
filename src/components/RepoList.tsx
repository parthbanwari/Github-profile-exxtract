import { useState } from 'react';
import { StarIcon, GitForkIcon, BookIcon, EyeIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Repo {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  language: string;
  updated_at?: string;
  created_at?: string;
  topics?: string[];
  watchers_count?: number;
}

interface RepoListProps {
  repos: Repo[];
}

export function RepoList({ repos }: RepoListProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination values
  const totalItems = repos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = repos.slice(startIndex, endIndex);
  
  // Format the date to a readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToFirstPage = () => goToPage(1);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToLastPage = () => goToPage(totalPages);
  
  // Items per page handler
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };

  // Calculate table container height based on items per page
  // For smaller numbers (5-10), use dynamic height, for larger use fixed height with scroll
  const getTableContainerClasses = () => {
    if (itemsPerPage <= 10) {
      return "overflow-hidden";
    }
    return "overflow-auto max-h-96"; // 24rem/384px height with scrolling
  };

  return (
    <div className="space-y-4">
      <div className={getTableContainerClasses()}>
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-slate-800">
              <TableHead className="font-medium text-slate-200">Repository</TableHead>
              <TableHead className="font-medium text-slate-200">Info</TableHead>
              <TableHead className="font-medium text-slate-200 text-right">Stats</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((repo) => (
              <TableRow key={repo.id} className="hover:bg-slate-800/30 border-slate-700">
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookIcon className="h-4 w-4 text-slate-400" />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline text-blue-400"
                      >
                        {repo.name}
                      </a>
                    </div>
                    {repo.description && (
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600">
                            {topic}
                          </Badge>
                        ))}
                        {repo.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600">
                            +{repo.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">
                        {repo.language || 'None'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <CalendarIcon className="h-3 w-3" />
                      Created: {formatDate(repo.created_at)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <CalendarIcon className="h-3 w-3" />
                      Updated: {formatDate(repo.updated_at)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 text-yellow-400">
                      <StarIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{repo.stargazers_count}</span>
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <GitForkIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{repo.forks_count}</span>
                    </span>
                    {repo.watchers_count && (
                      <span className="flex items-center gap-1 text-green-400">
                        <EyeIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{repo.watchers_count}</span>
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-slate-700 pt-4">
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToFirstPage} 
              disabled={currentPage === 1}
              className="h-8 w-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToPrevPage} 
              disabled={currentPage === 1}
              className="h-8 w-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Create a range of page numbers centered around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => goToPage(pageNum)}
                  className={`h-8 w-8 ${
                    currentPage === pageNum 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className="h-8 w-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToLastPage} 
              disabled={currentPage === totalPages}
              className="h-8 w-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {startIndex + 1} - {endIndex} of {totalItems} items
            </span>
            <div className="flex items-center">
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="h-8 w-32 border-slate-700 bg-slate-800 text-slate-300">
                  <SelectValue placeholder="10 per page" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}