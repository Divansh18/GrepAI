export interface GithubWebhookUserDto {
  login: string;
}

export interface GithubWebhookRepositoryDto {
  name: string;
  full_name: string;
}

export interface GithubWebhookPullRequestDto {
  number: number;
  title: string;
  html_url: string;
  user: GithubWebhookUserDto;
}

export interface GithubWebhookDto {
  action: string;
  repository: GithubWebhookRepositoryDto;
  pull_request?: GithubWebhookPullRequestDto;
  sender?: GithubWebhookUserDto;
}
